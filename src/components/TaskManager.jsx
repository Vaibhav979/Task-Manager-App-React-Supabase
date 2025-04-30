import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

const TaskManager = ({ session }) => {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState([]);
  const [newDescription, setNewDescription] = useState("");
  const [taskImage, setTaskImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = null;
    if (taskImage) {
      imageUrl = await uploadImage(taskImage); // upload the image and get the URL
    }
    const taskData = {
      ...newTask,
      email: session.user.email,
      img_url: imageUrl,
    };
    const { error, data } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) {
      alert(`Error adding task: ${error.message}`);
      return;
    }

    console.log("Task added:", data);
    setNewTask({ title: "", description: "" });
  };

  const uploadImage = async (file) => {
    const filePath = `${file.name}-${Date.now()}`; // unique file name
    const { error } = await supabase.storage
      .from("tasks-images")
      .upload(filePath, file); // upload the file to Supabase storage (query)

    if (error) {
      alert("Error uploading image", error.message);
      return null;
    }
    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);
    return data.publicUrl; // return the public URL of the uploaded image
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // if there is a file
      setTaskImage(e.target.files[0]); // set the file to state
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      alert("Error deleting task", error.message);
      return;
    }

    setNewTask({ title: "", description: "" });
  };

  const updateTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) {
      alert("Error deleting task", error.message);
      return;
    }

    setNewTask({ title: "", description: "" });
  };

  const fetchTasks = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      alert("Error reading task", error.message);
      return;
    }
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("tasks-channel");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const newTask = payload.new;
          setTasks((prevTasks) => [...prevTasks, newTask]);
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status);
      });
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, key) => (
          <li
            key={key}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <img src={task.img_url} style={{ height: 70 }} />
              <div>
                <textarea
                  placeholder="Updated description..."
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <button
                  style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
                  onClick={() => updateTask(task.id)}
                >
                  Edit
                </button>
                <button
                  style={{ padding: "0.5rem 1rem" }}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskManager;
