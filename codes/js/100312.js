import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default function GradingDoc() {
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    const storage = getStorage();
    const storageRef = ref(storage, 'path/to/your/file'); // Replace with your file path
  
    getDownloadURL(storageRef)
      .then((url) => {
        setFileUrl(url);
      })
      .catch((error) => {
        console.error('Error getting file URL:', error);
      });
  }, []);

  const handleFileSubmit = async () => {
    // Assuming the file is an image and you want to use Gemini's multimodal capabilities:
    const response = await genAI.generateImage(fileUrl, {
      prompt: "Grade the file according to the given Ruberics and give a final score just the score return nothing else except the score",
    });

    console.log(response.text);
  };

  return (
    <div>
      {fileUrl && (
        <button onClick={handleFileSubmit}>Analyze Image with Gemini</button>
      )}
    </div>
  );
}