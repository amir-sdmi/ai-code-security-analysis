import db from '../../../lib/db';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API Handler
export async function POST(req) {
  try {
    const body = await req.json();
    //const action = body.action;
    const { action, startMonth, startYear, endMonth, endYear,storedId, file } = body;

      if (action === 'analyzeData') {
        // ตรวจสอบว่าได้รับค่าที่จำเป็นหรือไม่
        if (!startMonth || !startYear || !endMonth || !endYear) {
          return NextResponse.json({ success: false, message: "ข้อมูลวันที่ไม่ครบถ้วน" });
        }
  
        // สร้างช่วงวันที่จากข้อมูลที่ส่งมา
        const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-31`; // รองรับเดือนที่มี 31 วัน
  
        // ดึงข้อมูลจากฐานข้อมูลในช่วงวันที่ที่กำหนด
        const query = `SELECT title, location, detail FROM notify WHERE date BETWEEN ? AND ?`;
        const data = await db.query(query, [startDate, endDate]);
        console.log("ข้อมูลที่ได้จากฐานข้อมูล:", data);

      if (data.length === 0) {
        return NextResponse.json({ success: false, message: "ไม่พบข้อมูลสำหรับการวิเคราะห์" });
      }

      // Extract the actual data from the query result
      const notifyData = data[0];

      // Prepare the input text for analysis
      const inputText = `กรุณาวิเคราะห์เหตุการณ์ต่อไปนี้และให้ข้อมูลดังนี้:
      สรุปเหตุการณ์,สาเหตุที่เป็นไปได้,การคาดการณ์ปัญหาในอนาคต 
      เขียนเป็นภาษาทางการ และถ้ามีตัวเลขในข้อความที่ตอบกลับให้เปลี่ยนจากเลขอาราบิกเป็นเลขไทย

      โปรดเขียนเป็นภาษาไทยและจำกัดความยาวไม่เกิน 150 คำ

      รายละเอียดเหตุการณ์:
      ` + notifyData
        .map(item => `- เครื่อง: ${item.title}, ตำแหน่ง: ${item.location}, ปัญหา: ${item.detail}`)
        .join("\n");

      // Use Gemini AI to generate the analysis
      const result = await model.generateContent(inputText);
      const analysisText = result.response.text(); // Get the generated text

      console.log("ข้อความที่ส่งไปยัง AI:", inputText);
      console.log("ผลลัพธ์จาก AI:", analysisText);

      return NextResponse.json({
        success: true,
        analysis: analysisText || "ไม่สามารถวิเคราะห์ข้อมูลได้",
      });
    }
    if (action === 'fetchEmployeeData') {
      const id = body.id; // ดึงค่า id จาก body
      if (!id) {
        return NextResponse.json({ success: false, message: "ไม่มี ID ที่ส่งมาในคำขอ" });
      }

      const query = "SELECT name,lastname,position FROM role_admin WHERE id = ?";
      const [employeeData] = await db.query(query, [id]);
      console.log("kkkkkk",employeeData);

      if (!employeeData) {
        return NextResponse.json({ success: false, message: "ไม่พบข้อมูลพนักงาน" });
      }

      return NextResponse.json({
        success: true,
        data: employeeData,
      });
    }

    if (action === 'fetchLocations') {
      const { type, code } = body;

      if (!type) {
        return NextResponse.json({ success: false, message: "กรุณาระบุประเภทข้อมูลที่ต้องการ" });
      }

      let query = "";
      let params = [];

      if (type === 'province') {
        query = "SELECT DISTINCT province_code, province FROM tambons";
      } else if (type === 'amphoe') {
        if (!code) {
          return NextResponse.json({ success: false, message: "กรุณาระบุรหัสจังหวัด" });
        }
        query = "SELECT DISTINCT amphoe_code, amphoe FROM tambons WHERE province_code = ?";
        params = [code];
      } else if (type === 'tambon') {
        if (!code) {
          return NextResponse.json({ success: false, message: "กรุณาระบุรหัสอำเภอ" });
        }
        query = "SELECT tambon_code, tambon, zipcode FROM tambons WHERE amphoe_code = ?";
        params = [code];
      } else {
        return NextResponse.json({ success: false, message: "ประเภทข้อมูลไม่ถูกต้อง" });
      }

      const [locations] = await db.query(query, params);

      if (!locations || locations.length === 0) {
        return NextResponse.json({ success: false, message: "ไม่พบข้อมูลในฐานข้อมูล" });
      }

      return NextResponse.json({
        success: true,
        data: locations,
      });
    }

    if (action === 'aveFileToDatabaseData') {
      const saveFileToDatabase = async ({ storedId, file }) => {
          if (!file || !storedId) {
              throw new Error("ข้อมูลไม่ครบถ้วน: ไม่มีไฟล์หรือ storedId");
          }

          const employeeData = await getEmployeeData(storedId);
          if (!employeeData) {
              throw new Error("ไม่พบข้อมูลพนักงานในฐานข้อมูล");
          }

          const creatorName = `${employeeData.name} ${employeeData.lastname}`;
          const createdAt = formatDateToMySQL(new Date().toISOString());
          const fileName = "แบบ จป.(ท)";
          const queryInsert = `INSERT INTO documents (document_name, creator_name, created_at, file_url, admin_id) VALUES (?, ?, ?, ?, ?)`;
          const values = [fileName, creatorName, createdAt, file, storedId];

          await db.query(queryInsert, values);
          return { success: true, message: "File saved successfully." };
      };

      const saveResult = await saveFileToDatabase({ storedId, file });
      return NextResponse.json(saveResult);
  }

  return NextResponse.json({
      success: false,
      message: 'Invalid action',
  }, { status: 400 });

} catch (error) {
  console.error("Error during request handling:", error);
  return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
}
}

const formatDateToMySQL = (isoString) => {
const date = new Date(isoString);
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const hours = String(date.getHours()).padStart(2, '0');
const minutes = String(date.getMinutes()).padStart(2, '0');
const seconds = String(date.getSeconds()).padStart(2, '0');
return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getEmployeeData = async (storedId) => {
try {
  const query = "SELECT name, lastname FROM role_admin WHERE id = ?";
  const [rows] = await db.query(query, [storedId]);

  if (!rows || rows.length === 0) {
      throw new Error("ไม่พบข้อมูลพนักงาน");
  }

  return rows[0];
} catch (error) {
  console.error("Error retrieving employee data:", error);
  return null;
}
};

