import { useNavigate } from "react-router-dom";

function Sidebar() {

  const navigate = useNavigate();

  const menu = [

    {
      icon:"🏠",
      title:"Dashboard",
      path:"/dashboard"
    },

    {
      icon:"🤖",
      title:"AI Chat",
      path:"/ai"
    },

    {
      icon:"📄",
      title:"PDF Chat",
      path:"/pdf"
    },

    {
      icon:"📝",
      title:"Smart Notes",
      path:"/notes"
    },

    {
      icon:"🧠",
      title:"Quiz",
      path:"/quiz"
    },

    {
      icon:"💻",
      title:"Coding",
      path:"/coding"
    },

    {
      icon:"📅",
      title:"Study Planner",
      path:"/planner"
    },

    {
      icon:"📸",
      title:"Image Solver",
      path:"/image"
    },

    {
      icon:"📈",
      title:"Progress",
      path:"/progress"
    }

  ];

  return (

    <aside className="sidebar">

      <h1 className="logo">
        GI
      </h1>

      <p className="tagline">
        Learn Smarter with GI
      </p>

      {
        menu.map((item)=>(

          <button

            key={item.title}

            className="sidebar-btn"

            onClick={()=>navigate(item.path)}

          >

            {item.icon}

            <span>

              {item.title}

            </span>

          </button>

        ))
      }

    </aside>

  );

}

export default Sidebar;