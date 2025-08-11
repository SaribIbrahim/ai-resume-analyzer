import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Auth" },
  { name: "description", content: "Log into ypur account" },
];

const auth = () => {

  const {isLoading,auth}=usePuterStore();
  const location=useLocation();
  const next=location.search.split('next=')[1];
  const navigate=useNavigate();

  useEffect(()=>{
    if(auth.isAuthenticated) navigate(next) 
  },[auth.isAuthenticated,next])
    
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradiant-border shadow-lg">
        <section className="flex flex-col gap-2 bg-white rounded-2xl p-10">
          <div className="flex flex-col gap-2 items-center text-center">
            <h1>Welcome</h1>
            <h2>Log In to Continue Your Job Journey</h2>
          </div>
          {
            isLoading?(
                <button className="auth-button animate-pulse">
                    <p>Signing you in...</p>
                </button>
            ):(
                <>
                    {auth.isAuthenticated?(
                        <button className="auth-button" onClick={auth.signOut}>
                            <p>Log Out</p>
                        </button>
                    ):(
                        <button className="auth-button" onClick={auth.signIn}>
                            <p>Log In</p>
                        </button>
                    )}
                </>
            )
          }
        </section>
      </div>
    </main>
  );
};

export default auth;
