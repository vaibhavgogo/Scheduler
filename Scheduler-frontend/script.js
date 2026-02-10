let title=document.getElementById("content");
let list=document.getElementById("lists");
function add(){
if(title.value==""){
    alert("Please enter your activity");}
    else{
          let task = document.createElement("div");
    task.className = "task-title";
    task.innerText = title.value;
    let li=document.createElement("li");
  
     let info = document.createElement("input");
    info.type = "text";
    info.placeholder = "Add more info about this activity...";
    info.className = "task-info";
    let span=document.createElement("span")
    span.innerHTML="\u00d7";
   
   
    li.appendChild(task);
    li.appendChild(info);
    li.appendChild(span);
    list.appendChild(li);
    title.value="";
     save();}
}
list.addEventListener("click",function(e){
   if(e.target.tagName==="SPAN"){
        e.target.parentElement.remove();
             save();
    }
},false);
function save(){
    localStorage.setItem("data",list.innerHTML);
}
function show(){
    list.innerHTML=localStorage.getItem("data");
}
function get() {
  let activities = [];

  const items = document.querySelectorAll("#lists li");

  items.forEach(li => {
    const titleEl = li.querySelector(".task-title");
    const infoEl = li.querySelector(".task-info");

    if (!titleEl) return;

    activities.push({
      title: titleEl.innerText.trim(),
      info: infoEl ? infoEl.value.trim() : ""
    });
  });

  return activities;
}
async function generate() {
  const tasks = get();
  console.log("Sending to AI:", tasks);

  if (tasks.length === 0) {
    alert("Please add activities first");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/ai-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: "09:00",
        endTime: "21:00",
        activities: tasks
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Backend error:", errText);
      throw new Error(errText);
    }

    const schedule = await response.json();
    const chatBox = document.getElementById("chatOutput");
    chatBox.innerHTML = "";

    if (!Array.isArray(schedule) || schedule.length === 0) {
      chatBox.innerHTML = `
        <div class="chat-bubble warning">
          ⚠️ No valid activities found.<br>
          Please enter clear, real activities.
        </div>
      `;
      return;
    }

    schedule.forEach(task => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.innerHTML = `
        🤖 <strong>Day ${task.day}</strong><br>
        <strong>${task.task}</strong><br>
        🕒 ${task.start} – ${task.end}<br>
        📝 ${task.reason || ""}
      `;
      chatBox.appendChild(bubble);
    });

  } catch (err) {
    console.error("FETCH FAILED:", err);
    alert("AI scheduling failed. Check console & backend.");
  }
}
