import { useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import Tesseract from "tesseract.js";

const MAXSIZE = 4 * 1024 * 1024;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [lang, setLang] = useState<"rus" | "eng">("rus");
  const [loading, setLoading] = useState<"idle" | "pending" | "done">("idle");
  const [isClicked, setIsClicked] = useState<boolean>(false);

  const handleAccept = async () => {
    if (file === null) {
      return;
    }

    setLoading("pending");
    const { data } = await Tesseract.recognize(file, lang, {
      logger: (m) => console.log(m),
    });
    setLoading("done");
    setText(data.text);
    console.log(data);
  }

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items || items.length === 0) {
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.type.indexOf("image") !== -1) {
        const blob = items[i]!.getAsFile();
        if (blob) {
          const file = new File([blob], "pasted-image.png", { type: "image/png" });
          setFile(file);
          break;
        }
      }
    }
  };

  const handleCopyClick = () => {
    setIsClicked(true);
    navigator.clipboard.writeText(text);
  }

  const terminateProcess = () => {
    setFile(null);
    setText('');
    setLoading('idle');
  }

  const handleReplaceClick = (charToReplace: string, newChar: string) => {
    if (text === '') {
      return;
    }
    const escapedCharToReplace = charToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newText = text.replace(new RegExp(escapedCharToReplace, 'gi'), newChar);
    setText(newText);
  }

  useEffect(() => {
    window.addEventListener("paste", handlePaste as EventListener);
    return () => {
      window.removeEventListener("paste", handlePaste as EventListener);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClicked) {
      timer = setTimeout(() => {
        setIsClicked(false);
      }, 1500);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isClicked]);

  useEffect(() => {
    if (file !== null && file.size > 10 * 1024 * 1024) {
      setFile(null);
      alert("Файл слишком большой (больше 10 МБ). Вы будете ожидать его обработку вечность. Пожалуйста, выберите другой.");
    }
  }, [file]);

  return (
    <>
    <h1>Конвертер изображений в текст</h1>
    <div className="container">
      <div className="container__content">
        <div className="container__drag-drop">
          {file === null ?
          <DragDrop setFile={setFile} /> :
          <img src={URL.createObjectURL(file)} className="container__image" alt="" />
          }
        </div>
        {file !== null &&
        <>
        <div className="container__file-size">Размер изображения: {(file.size / 1024 / 1024).toFixed(3)} МБ</div>
        {(file.size > MAXSIZE) && 
        <div className="container__file-size-warning">Дружище, твой файл весит более {MAXSIZE / 1024 / 1024} МБ. Обработка может занять длительное время!</div>
        }
        </>
        }
        <div className="container__loading-status">Статус: {loading === "pending" ? "Загрузка..." : file === null ? "Добавьте файл или вставьте, нажав ctrl+V" : "Ожидает подтверждения"}</div>
        <div className="container__lang">Язык: {lang}</div>
        <div className="container__buttons">
          <button disabled={loading === "pending" || file === null} onClick={handleAccept} className="container__button">{"Подтвердить"}</button>
          <button disabled={loading === "pending" || file === null} onClick={() => setFile(null)} className="container__button">Убрать файл</button>
          <button disabled={loading === "pending" || lang === "rus"} onClick={() => setLang("rus")} className="container__button">Выставить русский язык</button>
          <button disabled={loading === "pending" || lang === "eng"} onClick={() => setLang("eng")} className="container__button">Выставить английский язык</button>
          <button disabled={loading !== "pending"} onClick={terminateProcess} className="container__button">Остановить процесс обработки</button>
        </div>
      </div>
      <div className="container__text text">
        <div className="text__buttons">
          <div className="text__main-buttons">
            <button disabled={text === ""} className="container__button copy-button" onClick={handleCopyClick}>{isClicked ? "Текст скопирован" : "Скопировать текст"}</button>
            <button disabled={text === ""} className="container__button copy-button" onClick={() => setText("")}>Очистить текст</button>
          </div>
          <div className="text__replace-buttons">
            <button disabled={text === ""} className="container__button copy-button" onClick={() => handleReplaceClick('©', 'c')}>Заменить © на c</button>
            <button disabled={text === ""} className="container__button copy-button" onClick={() => handleReplaceClick('€', 'c')}>Заменить € на c</button>
            <button disabled={text === ""} className="container__button copy-button" onClick={() => handleReplaceClick('¢', 'c')}>Заменить ¢ на c</button>
            <button disabled={text === ""} className="container__button copy-button" onClick={() => handleReplaceClick('|', 'I')}>Заменить | на I</button>
          </div>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="container__textarea"></textarea>
      </div>
    </div>
    </>
  );
}

function DragDrop({ setFile }: { setFile: (file: File) => void }) {
  const handleChange = (file: File) => {
    setFile(file);
  };
  return (
    <FileUploader handleChange={handleChange} name="file" types={["PNG"]} />
  );
}

export default App;
