import React, { useState, useEffect } from "react";
import "./App.css";
import TaskManager from "./components/TaskManager";
import Auth from "./components/Auth";
import { supabase } from "./components/supabase-client";

function App() {
  const [session, setSession] = useState(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    setSession(currentSession.data.session);
  };

  useEffect(() => {
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {session ? (
        <>
          <button onClick={logout}>Log Out</button>
          <TaskManager session={session} />{" "}
        </>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;
