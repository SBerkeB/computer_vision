import { useState, useRef, useEffect } from 'react'
import { Box, Container, Typography, Card, CardContent, Stack, Button, LinearProgress } from '@mui/material'
import { FileUploader } from "react-drag-drop-files"
import './App.css'
import { createWorker } from 'tesseract.js';

function App() {
  const [file, setFile] = useState<null | File[]>(null);
  const [image, setImage] = useState<unknown>();
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('idle');
  const [ocrResult, setOcrResult] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const query = async () => {
    setProgress(10);
    setProgressLabel('Starting');
    const response = await fetch(
      "https://api-inference.huggingface.co/models/dataautogpt3/OpenDalle",
      {
        headers: { Authorization: "Bearer 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" },
        method: "POST",
        body: JSON.stringify({"inputs": ocrResult}),
      }
    );
    setProgress(30);
    const result = await response.blob();


    setProgress(60);
    setProgressLabel('Assigning URL');
    
    const objectUrl = URL.createObjectURL(result);

    setImageSrc(objectUrl);
    setProgress(100);
    setProgressLabel('Done');
    return result;
  }
  


  const workerRef = useRef<Tesseract.Worker | null>();
  useEffect (() => {
    workerRef.current = createWorker({
      logger: message => {
        if ('progress' in message) {
          setProgress(message. progress);
          setProgressLabel(message.progress == 1 ? 'Done' : message.status);
        }
      }
    });
    return () => {
      workerRef.current = null;
    }
  }, []);

  const dropBoxHandler = (file: File[]) => {
    const reader = new FileReader();
    setFile(file);

    try {
      reader.readAsDataURL(file[0])
      reader.onload = () => {
        setImage(reader.result as string);
        console.log(image);
      }
    }
    catch (err){
      alert(err);
    }

  }

  const clearHandler = () => {
    setFile(null);
    setImage(null);
    setImageSrc(null);
    setOcrResult('');
  }

  const extractHandler = async () => {
    setProgress(10);
    setProgressLabel('starting');

    const worker = workerRef.current!;
    await worker.load();
    setProgress(25); 
    await worker.loadLanguage('eng');
    setProgress(50); 
    await worker.initialize('eng');
    setProgress(75); 

    if (file) {
      const response = await worker.recognize(file[0]);
      
      setOcrResult(response.data.text);
    }

    setProgress(100);
  }
  

  return (
    <>
      <Box sx={{height: '100vh', bgcolor: '#e7ebf0'}}>

        <Container sx={{display:"flex", flexDirection:"column",
        justifyContent: "center", alignItems:"center"}}>
          
          <Typography variant='h4' gutterBottom pt={2} color="primary"> Image Receiver </Typography>

          <Card sx={{maxWidth: "600px"}}>
            <CardContent>

              <Stack direction="row" justifyContent="center">
                <FileUploader 
                multiple={true}
                name="file"
                type={["jpeg", "png", "jpg"]}
                handleChange={(file: File[]) => dropBoxHandler(file)}
                />
              </Stack>

              <Typography align='center'>
                {file ? `File name: ${String(file[0].name)}` : "No file selected" }
              </Typography>

              <Stack direction="row" justifyContent="space-between" mt={2}>
                <Button variant="contained" onClick={extractHandler}
                disabled={!file || !workerRef.current}> Extract </Button>
                <Button variant="contained" color="error" onClick={clearHandler}> Cancel </Button>
              </Stack>

                <Button variant="contained" onClick={query} disabled={!ocrResult}> Generate </Button>
            </CardContent>
          </Card>

        </Container>


        <Stack sx={{height: '100vh', bgcolor: '#e7ebf0'}}>

          <Container sx={{display:"flex", flexDirection:"column"}}>
            <Typography color={"black"}>{progressLabel}</Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Container>

          {ocrResult && !imageSrc && <Typography color={"black"}>{ocrResult}</Typography> }

          <Box sx={{height: '800vh', bgcolor: '#e7ebf0'}}>
            <Container sx={{display:"flex", flexDirection:"column"}}>
              {imageSrc && <img src={imageSrc} alt="Generated" />}
            </Container>
          </Box>

        </Stack>
    </Box>
    </>
  )
}

export default App
