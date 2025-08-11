import { prepareInstructions } from '../../constants/index'
import React, { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader'
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdf2image'
import { usePuterStore } from '~/lib/puter'
import { generateUUID } from '~/lib/utils'

const upload = () => {
    const {auth,isLoading,fs,ai,kv}=usePuterStore();
    const navigate=useNavigate();
    const [isProcessing,setIsProcessing]=useState(false)
    const [statusText,setStatusText]=useState("") 
    const [file,setFile]=useState <File | null> (null)

    const handleSelectFile = (file:File|null)=>{
        setFile(file)
    }

    const handleAnalyze=async({companyName,jobTitle,jobDescription,file}:{companyName:string,jobTitle:string,jobDescription:string,file:File})=>{

        setIsProcessing(true);
        setStatusText("Uploading the file...");
        const uploadedFile=await fs.upload([file])//passing file to puter

        if(!uploadedFile) return setStatusText("Error: Failed to upload File")
        
        setStatusText("Converting to image...")

        const imageFile=await convertPdfToImage(file);

        if(!imageFile.file) return setStatusText("Error: Failed to convert to image")

        setStatusText("Uploading the image....")

        const uploadedImage=await fs.upload([imageFile.file])

        if(!uploadedImage) return setStatusText("Error: Failed to upload image")

        setStatusText("Preparing data...")

        const uuid=generateUUID();//generating unique id

        const data={
            id:uuid,
            resumePath:uploadedFile.path,
            imagePath:uploadedImage.path,
            companyName,jobDescription, jobTitle,
            feedback:""
        }// storing all data in object

        await kv.set(`resume:${uuid}`,JSON.stringify(data));

        setStatusText("Analyzing...")

        const feedback=await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle,jobDescription})//func in constants/index
        )//passing data to puter ai for feedback

        if(!feedback) return setStatusText("Error: Failed to analyze")
        
        const feedbackText=typeof feedback.message.content==="string"
        ?feedback.message.content : feedback.message.content[0].text 

        data.feedback=JSON.parse(feedbackText) // storing feedback from ai to data obj
        await kv.set(`resume:${uuid}`,JSON.stringify(data));
        setStatusText("Analysis complete,redirecting...");
        navigate(`/resume/${uuid}`)
        

    }
    
    const handleSubmit = (e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        const form=e.currentTarget.closest('form')//getting form data
        if(!form) return;//if no form then return
        const formData =new FormData(form) // so we can get values from form
        const companyName=formData.get('company-name') as string;//get val from form
        const jobTitle=formData.get('job-title') as string ;
        const jobDescription=formData.get('job-description') as string;
        
        if(!file) return // if there is no file return

        handleAnalyze({companyName,jobTitle,jobDescription,file});//pass them to func
    }

    return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className='page-heading py-16'>
            <h1>Smart feedback for your dream job</h1>
            {
                isProcessing?(
                    <>
                        <h2>{statusText}</h2>
                        <img src="/images/resume-scan.gif" alt="Scanning Gif" className='w-full' />
                    </>
                ):(
                    <h2>Drop your resume for an ATS score and improvement tips</h2>
                )
            }
            {
                !isProcessing && (
                    <form id='upload-form' onClick={handleSubmit} className='flex flex-col gap-4 mt-8'>
                        <div className='form-div'>
                            <label htmlFor="company-name">Company Name</label>
                            <input type="text" name='company-name' id='company-name' placeholder='Company Name' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor="job-title">Job Title</label>
                            <input type="text" name='job-title' id='job-title' placeholder='Job Title' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor="job-description">Job Description</label>
                            <textarea rows={5}  name='job-description' id='job-description' placeholder='Job Description' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor="uploader">Upload Resume</label>
                            <FileUploader onFileSelect={handleSelectFile}/>
                        </div>
                        <button className='primary-button' type='submit'>Analyze Resume</button>
                    </form>
                )

            }
        </div>
      </section>
    </main>
  )
}

export default upload