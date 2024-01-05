"use client";
import { useEffect, useState } from "react";
import CreateQuestBtn from "../CreateQuestBtn/CreateQuestBtn";
import styles from "./FreeQuest.module.css";

const MSG_NO_ANS = "Please enter an answer";
const MSG_SERVER_ERR = "There was an error saving";

export default function FreeQuest({ questionIdx, ansObj, onChangeAnswer, onVerifiedSubmit }) {
  const [submitMsg, setSubmitMsg] = useState({msg: "", isSuccess: false});
  
  const initialText = !ansObj 
    ? "" 
    : !ansObj.answers 
    ? "" 
    : typeof ansObj.answers[0] === "string"
    ? ansObj.answers[0] 
    : "";
  
  const onChange = (e) => {
    const updatedAnsObj = {
      answers: [e.target.value],
      correctIndex: 0
    };
    return onChangeAnswer(updatedAnsObj, questionIdx);
  }

  const onSubmit = () => {
    if(initialText) {
      return onVerifiedSubmit(questionIdx, {correctIndex: 0, answers: [initialText]})
        .then(() => setSubmitMsg({msg: "Saved", isSuccess: true}))
        .catch(err => setSubmitMsg({msg: err, isSuccess: false}));
    }
    return setSubmitMsg({msg: MSG_NO_ANS, isSuccess: false});
  }

  useEffect(() => {
    setSubmitMsg({msg: "", isSuccess: false});
  }, [ansObj]);
  
  return (
    <div className={styles.cont}>
      <div className={styles.label}>Answer: </div>
      <div className={styles.input_cont}>
        <textarea
          className={submitMsg.msg === MSG_NO_ANS 
            ? `${styles.text} ${styles.err_border}` 
            : styles.text}
          placeholder="Answer"
          value={initialText}
          onChange={onChange}
          rows={1}
          required
        />
      </div>
      <CreateQuestBtn
        msg={submitMsg.msg}
        onClick={onSubmit}
        isSuccess={submitMsg.isSuccess}/>
    </div>
    
  )
}