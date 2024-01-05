"use client";
import { useEffect, useRef, useState } from "react"
import Dropdown from "../Dropdown/Dropdown";
import MultiQuest from "../Questions/MultiQuest/MultiQuest";
import styles from "./AddQuest.module.css";
import DeleteBtn from "../DeleteBtn/DeleteBtn";
import ConfirmPrompt from "../ConfirmPrompt/ConfirmPrompt";
import FreeQuest from "../Questions/FreeQuest/FreeQuest";
import MatrixQuest from "../Questions/MatrixQuest/MatrixQuest";
import Image from "next/image";
import iconPlus from "@/public/plus_icon.svg";

import { getQuestions, addQuestion, editQuestion, deleteQuestion } from "@/api/api.mjs";

const TYPE_MULTI = "Multi-Choice";
const TYPE_FREE = "Free-Response";
const TYPE_MATRIX = "Matrix";
const QUEST_OPTS = [TYPE_MULTI, TYPE_FREE, TYPE_MATRIX];
const MSG_NO_QUEST = "Please enter a question";
const MSG_NO_TIME = "Time limit must be a positive integer";
const MSG_INVALID_WEIGHT = "Weight must be a positive integer";
const MSG_OTHER_ERR = "There was a problem saving";
const MSG_SERVER_ERR = "Server error";

const BACKEND_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_DOMAIN + process.env.NEXT_PUBLIC_APPEND;

export default function AddQuest({ quizId }) {
  const [questData, setQuestData] = useState([]);
  const [ansData, setAnsData] = useState([]);
  const [deleteData, setDeleteData] = useState({msg: "", idx: -1});
  const [removeFileIdx, setRemoveFileIdx] = useState(-1);
  const [typeChangeData, setTypeChangeData] = useState({msg: "", subMsg: "", type: "", idx: -1});
  const [loading, setLoading] = useState(true);
  const imgRef = useRef();
  const formRef = useRef();

  useEffect(() => {
    async function updateQuestData() {
      let response = await getQuestions(quizId);
      let data = await response.json();
      let questData = [];
      let ansData = [];
      for (let i = 0; i < data.length; i++) {
        questData.push({
          questionId: data[i]._id,
          question: data[i].question,
          type: data[i].type,
          time: data[i].time,
          weight: data[i].weight,
          file: data[i].file ? data[i].file : "",
          fileSrc: `${BACKEND_DOMAIN}/questions/${data[i]._id}/image`,
          vis: true
        });
        ansData.push({
          correctIndex: data[i].correctIndex,
          answers: data[i].answers
        });
      }
      setQuestData(questData);
      setAnsData(ansData);
      setLoading(false);
    }    
    updateQuestData();
  }, []); 


  // Handlers for question events not in child components
  const onInput = (e, idxChanged) => {
    const updatedArr = questData.map((data, i) => {
      if (i !== idxChanged) return data;
      return {...data, [e.target.name]: e.target.value}
    });
    return setQuestData(updatedArr);
  }
  
  const onOptionClick = (type, idxChanged) => {
    const curType = questData[idxChanged].type;
    if(curType === type) return;
    const curAnswers = !ansData[idxChanged] 
      ? [""] 
      : ansData[idxChanged].answers
      ? ansData[idxChanged].answers
      : [""];
    const firstAns = curAnswers[0];
    if(curAnswers.length === 1 && curAnswers[0] === "") 
      return onConfirmTypeChange(type, idxChanged);
    if(curType === TYPE_MULTI) {
      let isEmpty = true;
      for(let ans of curAnswers) {
        if(ans) {
          isEmpty = false;
          break;
        }
      }
      if(isEmpty) return onConfirmTypeChange(type, idxChanged);
    }
    if(curType === TYPE_MATRIX) {
      let isEmpty = true;
      for(let row of firstAns) {
        for(let colItem of row) {
          if(colItem) {
            isEmpty = false;
            break;
          }
        }
        if(!isEmpty) break;
      }
      if(isEmpty) return onConfirmTypeChange(type, idxChanged);
    }
    const msg = `Change Q.${idxChanged + 1} to ${type}?`
    const subMsg = `Answers to Q.${idxChanged + 1} will be lost!`;
    return setTypeChangeData({msg: msg, subMsg: subMsg, type: type, idx: idxChanged});
  }

  const onConfirmTypeChange = (type, idxChanged) => {
    const updatedArrQ = questData.map((data, i) => {
      if (i !== idxChanged) return data;
      return {...data, type: type}
    });
    let updatedArrA;
    if(type === TYPE_MATRIX) {
      updatedArrA = ansData.map((data, i) => {
        if (i !== idxChanged) return data;
        return {correctIndex: 0, answers: [[["", ""], ["", ""]]]}
      });
    }
    else {
      updatedArrA = ansData.map((data, i) => {
        if (i !== idxChanged) return data;
        return {correctIndex: 0, answers: [""]}
      });
    }
    setQuestData(updatedArrQ);
    setAnsData(updatedArrA);
    return resetTypeChangeData();
  }

  const resetTypeChangeData = () => {
    return setTypeChangeData({msg: "", subMsg: "", type: "", idx: -1});
  }

  const onAddFile = (e, idxChanged) => {
    const img = e.target.files[0];
    const updatedArr = questData.map((data, i) => {
      if (i !== idxChanged) return data;
      return {...data, file: img, fileSrc: URL.createObjectURL(img)}
    });
    return setQuestData(updatedArr);
  }

  const onConfirmClearForm = () => {
    formRef.current.reset();
    const updatedArr = questData.map((data, i) => {
      if (i !== removeFileIdx) return data;
      return {...data, file: "", fileSrc: ""}
    });
    setRemoveFileIdx(-1);
    return setQuestData(updatedArr);
  }

  const onConfirmDelete = () => {
    const idxToDelete = deleteData.idx;
    const questionId = questData[idxToDelete].questionId;
    if (questionId)      
      deleteQuestion(questionId);
    setQuestData(questData.filter((q, i) => i !== idxToDelete));
    setAnsData(ansData.filter((a, i) => i !== idxToDelete));
    setDeleteData({msg: "", idx: -1});
  }

  const onAddQuestion = () => {
    setQuestData([...questData, {
      question: "", 
      type: "", 
      time: "",
      weight: "",
      vis: true
    }]);
    setAnsData([...ansData, {
      correctIndex: 0,
      answers: [""]
    }])
  }

  // Handler for events from child
  const onChangeAnswer = (updatedAnsObj, questionIdx) => {
    return setAnsData(ansData.map(
      (d, i) => i === questionIdx ? updatedAnsObj : d
    ));
  }

  const onVerifiedSubmit = (questionIdx, ansObj) => {
    return new Promise((resolve, reject) => {
      const questionObj = questData[questionIdx];
      if(!questionObj || !ansObj) reject(MSG_OTHER_ERR);
      const question = questionObj.question ? questionObj.question : "";
      const questionId = questionObj.questionId ? questionObj.questionId : "";
      const type = questionObj.type ? questionObj.type : "";
      const time = parseInt(questionObj.time) ? parseInt(questionObj.time) : -1;
      const weight = parseInt(questionObj.weight) ? parseInt(questionObj.weight) : -1;
      const file = questionObj.file ? questionObj.file : "";
      const answers = ansObj.answers ? ansObj.answers : [""];
      const correctIndex = ansObj.correctIndex ? ansObj.correctIndex : 0;
      if(question === "") return reject(MSG_NO_QUEST);
      if(!Number.isInteger(time) || time < 0) return reject(MSG_NO_TIME);
      if(!Number.isInteger(weight) || weight < 0) return reject(MSG_INVALID_WEIGHT);
      if(
        type === "" || 
        (answers.length === 1 && answers[0] === "") || 
        correctIndex === -1
      ) return reject(MSG_OTHER_ERR);
      // Edit question if already in DB, otherwise add a new one
      if (questionId)
        return editQuestion(questionId, question, type, time, correctIndex, answers, weight, file).then((async res => { 
          if (!res.ok) return res.json().then(reject);
          const data = await res.json();
          questionObj.questionId = data._id;
          setQuestData(questData.map(
            (d, i) => i === questionIdx ? questionObj : d
          ));
          resolve();
        })).catch(err => {
          console.log(err);
          return reject(MSG_SERVER_ERR);
        });
      else {
        return addQuestion(quizId, question, type, time, correctIndex, answers, weight, file).then((async res => { 
          if (!res.ok) return res.json().then(reject);
          const data = await res.json();
          questionObj.questionId = data._id;
          setQuestData(questData.map(
            (d, i) => i === questionIdx ? questionObj : d
          ));
          resolve();
        })).catch(err => {
          console.log(err);
          return reject(MSG_SERVER_ERR);
        });
      }
    })
  }
  

  return (
    loading ? <div>Loading...</div>
    :
    <div className={styles.quest_cont}>
      {questData?.map((data, idx) => 
        <div key={idx} className={styles.quest_img_cont}>
          <div className={`${styles.quest_cont} ${styles.border}`}>
            <div className={styles.header}>
              <div className={styles.header__info}>
                <div className={styles.header__info__label}>Q.{idx + 1}</div>
                <input
                  type="text"
                  name="question"
                  className={styles.header__info__question}
                  placeholder={`Question ${idx + 1}`}
                  value={data.question}
                  onInput={e => onInput(e, idx)}
                />
                <div 
                  onClick={() => setQuestData(questData.map((b, i) => i === idx ? {...b, vis: !data.vis} : b))}
                  className={styles.header__info__showhide}
                >
                  {data.vis ? "Hide" : "Show"}
                </div>
              </div>
              {!data.vis ? 
                <></>
                : 
                <div className={styles.header__opts}>
                  <div className={styles.header__opts__left}>
                    <div className={styles.header__opts__stack}>
                      <div className={styles.header__opts__text}>Type: </div>
                      <Dropdown 
                        list={QUEST_OPTS} 
                        onOptionClick={(opt) => onOptionClick(opt, idx)}
                        currentOpt={data.type !== "" ? data.type : "Select..."}
                      />
                    </div>
                    <div className={styles.header__opts__stack}>
                      <div className={styles.header__opts__text}>Time Limit (sec):</div>
                      <input
                        type="number"
                        name="time"
                        inputMode="numeric"
                        min={0}
                        className={styles.header__opts__input}
                        placeholder="ex: 20"
                        value={data.time}
                        onInput={e => onInput(e, idx)}
                      />
                    </div>
                    <div className={styles.header__opts__stack}>
                    <div className={styles.header__opts__text}>Weight (mulitplier):</div>
                      <input
                        type="number"
                        name="weight"
                        inputMode="numeric"
                        min={0}
                        className={styles.header__opts__input}
                        placeholder="ex: 1"
                        value={data.weight}
                        onInput={e => onInput(e, idx)}
                      />
                    </div> 
                    <div className={styles.header__opts__stack}>
                      <div className={styles.header__opts__text}>File (optional):</div>
                      <form ref={formRef} onSubmit={e => {e.preventDefault(); setRemoveFileIdx(idx)}}>
                        <input
                          ref={imgRef}
                          type="file"
                          name="file"
                          onChange={e => onAddFile(e, idx)}
                        />
                        {data.file ? 
                          <button type="submit">Remove File</button>
                          :
                          <></>
                        }
                      </form>
                    </div>
                  </div>
                  <DeleteBtn
                    itemIdx={idx}
                    text={`Q.${idx + 1}`}
                    onClick={idxDeleted => setDeleteData({msg: `Delete Q.${idxDeleted + 1}?`, idx: idxDeleted})}
                  />
                </div>
              }
            </div>
            {!data.vis ? 
              <></> 
            : data.type === TYPE_MULTI ? 
              <MultiQuest
                ansObj={ansData[idx]} 
                questionIdx={idx}
                onChangeAnswer={onChangeAnswer}
                onVerifiedSubmit={onVerifiedSubmit}/>
            : data.type === TYPE_FREE ? 
              <FreeQuest
                ansObj={ansData[idx]}
                questionIdx={idx}
                onChangeAnswer={onChangeAnswer}
                onVerifiedSubmit={onVerifiedSubmit}
              />
            : data.type === TYPE_MATRIX ?
              <MatrixQuest
                ansMatrix={ansData[idx].answers[0]}
                questionIdx={idx}
                onChangeAnswer={onChangeAnswer}
                onVerifiedSubmit={onVerifiedSubmit}
              />
            : <div className={styles.notype_text}>Select a question type from dropdown menu</div>
            }
          </div>
          {data.file 
            ? <img 
                src={data.fileSrc}
                alt={`Q${idx + 1} image`}
                className={`${styles.image} ${styles.border}`}
              />
            : <></>
          }
        </div>
      )}
      <div className={`${styles.add_quest_cont} ${styles.border}`} onClick={onAddQuestion}>
        <Image
          src={iconPlus}
          alt="Plus icon"
        />
        <div className={styles.add_quest_text}>Add Question</div>
      </div>
      {deleteData.msg ?
        <ConfirmPrompt
          title={deleteData.msg}
          subtitle={"All data for this question will be lost!"}
          conText={"Delete"}
          rejText={"Cancel"}
          onCon={onConfirmDelete}
          onRej={() => setDeleteData({msg: "", idx: -1})}
        />
        : 
        <></>
      }
      {typeChangeData.msg ?
        <ConfirmPrompt
          title={typeChangeData.msg}
          subtitle={typeChangeData.subMsg}
          conText={"Change"}
          rejText={"Cancel"}
          onCon={() => onConfirmTypeChange(typeChangeData.type, typeChangeData.idx)}
          onRej={resetTypeChangeData}
        />
        : 
        <></>
      }
      {removeFileIdx !== -1 ?
        <ConfirmPrompt
          title={`Remove Q.${removeFileIdx + 1}'s Image?`}
          subtitle={"The file will be lost!"}
          conText={"Remove"}
          rejText={"Cancel"}
          onCon={onConfirmClearForm}
          onRej={() => setRemoveFileIdx(-1)}
        />
        :
        <></>
      }
    </div>
  )
}
