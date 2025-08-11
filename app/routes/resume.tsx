import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  useEffect(()=>{
    if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`) 
  },[isLoading])

  useEffect(() => {
    // This function will run whenever the "id" in the URL changes

    const loadResume = async () => {
      //  Fetch the resume data from key-value storage using the provided "id"
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return; // If no resume is found, exit early

      //  Parse the JSON data stored in the KV database
      const data = JSON.parse(resume);

      // Read the actual PDF file (resume) from the file storage
      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return; // Exit if no PDF is found

      // Convert the PDF blob into a downloadable/previewable URL
      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl); // Save this URL in state so it can be displayed

      // Read the preview image from file storage
      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return; // Exit if no image is found

      //  Convert the image blob into a displayable URL
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl); // Save this image URL in state

      // Store the feedback text from the JSON data into state
      setFeedback(data.feedback);
    };

    loadResume();

    // This hook depends on "id" — runs again if the URL parameter changes
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noreferrer noopener">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold ">Resume  Review</h2>
          {
            feedback ? (
                <div className="flex flex-col gap-2 animate-in fade-in duration-1000">
                    <Summary feedback={feedback} />
                    <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []}/>
                    <Details feedback={feedback} />
                </div>
            ) : (
                <img src="/images/resume-scan-2.gif" alt="No feedback yet" className="w-full" />
            )
          }
        </section>
      </div>
    </main>
  );
};

export default Resume;
