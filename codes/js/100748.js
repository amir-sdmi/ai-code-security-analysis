import DataCard from "../components/DataCard";

const page = () => {
  const arr = [
    {
      title: "Payment Sheet",
      content: "Google sheet containing dates and other details of work",
      link: "https://docs.google.com/spreadsheets/d/1VaSy38rZzTQ_Vel3TeDVeD1Snmxn_RU3Alu3k5vjWO8/edit?usp=sharing",
    },
    {
      title: "Android Dev Answers ChatGpt",
      content: "Chats done with chatGpt for generating android dev practical",
      link: "https://chat.openai.com/share/61081a03-42ae-4c4a-ba6f-e7b3279d1cc0",
    },
    {
      title: "G-Drive Notes Link",
      content: "Google drive folder for notes of all Semester",
      link: "https://drive.google.com/drive/folders/1M_AZyQFvonhopHq04_tKtReh9ZpBCZkA?usp=sharing",
    },
       {
      title: "G-Drive Android PDF Link",
      content: "Google drive folder for Android Ans PDF",
      link: "https://drive.google.com/file/d/1TxWOsfCGHmrp1r67YYj_8GexbPN1mB2X/view?usp=sharing",
    },
        {
      title: "G-Drive All SEM-VI Notes PDF Link",
      content: "Google drive folder for SEM VI Complete",
      link: "https://drive.google.com/drive/folders/0B4oElYNhW0StfkNCUlZLcGExXzVmOXY2cXBrdjZCTlZUc002RkxHYmFVZ01zYnp4VlNvZEU?resourcekey=0-pbqY-zaI-ehOV0WkryufuA&usp=drive_link",
    },
    
  ];
  return (
    <div className="min-h-screen ">
      {/* Card Section */}
      <div className="max-w-[70rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        {/* Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
          {/* Card */}
          {arr.map((item, index) => {
            return (
              <DataCard
                Title={item.title}
                Content={item.content}
                link={item.link}
                key={index}
              />
            );
          })}
        </div>
        {/* End Grid */}
      </div>
      {/* End Card Section */}
    </div>
  );
};

export default page;
