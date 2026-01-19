import { useContext } from "react";
import * as context from "~components/Provider/MyProvider";


const useExportData = () => {
  const [allTask,] = useContext(context.allTaskContext)
  const [order,] = useContext(context.orderContext)

  const onClickExport = () => {
    if (!confirm("ファイルをエクスポートします")) return

    try {
      const fileName = `${getMondayDate()}.json`
      const dataObj = { allTask: allTask, order: order, }
      const blobData = new Blob(
        [JSON.stringify(dataObj, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blobData)

      chrome.downloads.download({
        url: url,
        filename: fileName
      })
    } catch (error) {
      alert("エクスポートに失敗しました")
    }
  }

  // 月曜日の日付（YYYYMMDD）で返す With ChatGPT3.5
  const getMondayDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (日曜) から 6 (土曜) までの値を取得

    // 今日が日曜日の場合、6日前の日付を返す
    if (dayOfWeek === 0) {
      today.setDate(today.getDate() - 6);
    }
    // 今日が月曜日の場合、7日前の日付を返す
    else if (dayOfWeek === 1) {
      today.setDate(today.getDate() - 7);
    } else {
      // 今日から月曜日までの日数を計算し、日付を調整
      today.setDate(today.getDate() - dayOfWeek + 1);
    }

    // 年、月、日を取得
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため+1する
    const day = today.getDate().toString().padStart(2, '0');

    // yyyymmdd形式で日付を返す
    return `${year}${month}${day}`;
  }

  return { onClickExport, } as const
}

export default useExportData