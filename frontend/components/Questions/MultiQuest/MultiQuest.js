"use client";
import { useEffect, useState } from "react";
import CreateQuestBtn from "../CreateQuestBtn/CreateQuestBtn";
import StatusTextbox from "@/components/StatusTextbox/StatusTextbox";
import styles from "./MultiQuest.module.css";
import Image from "next/image";
import DeleteBtn from "@/components/DeleteBtn/DeleteBtn";
import iconCheck from "@/public/check_icon.svg";
import iconX from "@/public/x_icon.svg";
import iconPlus from "@/public/plus_icon.svg";

const MAX_ANSWER_NUM = 6;

const MSG_NO_ANSWERS = "Please add at least 1 answer";
const MSG_NO_CORRECT = "Please mark an answer as correct";
const MSG_FIX_ERRORS = "Fix all errors to save question";
const MSG_SUCCESS = "Saved";

export default function MultiQuest({ questionIdx, ansObj, onChangeAnswer, onVerifiedSubmit }) {
  const [errAns, setErrAns] = useState([]);
  const [submitMsg, setSubmitMsg] = useState({msg: "", isSuccess: false});
  const ansArr = !ansObj ? [""] : !ansObj.answers ? [""] : ansObj.answers;
  const corIdx = !ansObj ? 0 : !ansObj.correctIndex ? 0 : parseInt(ansObj.correctIndex);
 
  const onSubmit = (e) => {
    e.preventDefault();

    if(!ansObj || !ansObj.answers || ansObj.answers.length === 0) 
      return setSubmitMsg({msg: MSG_NO_ANSWERS, isSuccess: false});
    if(ansObj.answers.length > MAX_ANSWER_NUM) 
      return setSubmitMsg({msg: `Only ${MAX_ANSWER_NUM} answers allowed`, isSuccess: false});
    if(ansObj.correctIndex < 0 || ansObj.correctIndex >= ansObj.answers.length) 
      return setSubmitMsg({msg: MSG_NO_CORRECT, isSuccess: false});
    if(errAns.filter(e => e !== null).length > 0) 
      return setSubmitMsg({msg: MSG_FIX_ERRORS, isSuccess: false});

    return onVerifiedSubmit(questionIdx, {correctIndex: corIdx, answers: ansArr})
      .then(() => {
        setSubmitMsg({msg: MSG_SUCCESS, isSuccess: true})
      })
      .catch(err => setSubmitMsg({msg: err, isSuccess: false}));
  }

  const onClickCorrect = (idxCorrect) => {
    return onChangeAnswer({...ansObj, correctIndex: idxCorrect}, questionIdx);
  }

  const onInput = (e, idxChanged) => {
    setErrAns(
      errAns.map((e, eIdx) => eIdx === idxChanged ? null : e)
    );
    const updatedAnsArr = ansArr.map(
      (ans, i) => i === idxChanged ? e.target.value : ans
    );
    return onChangeAnswer({...ansObj, answers: updatedAnsArr}, questionIdx);
  }

  const onDelete = (idxToDel) => {
    const updatedAnsArr = ansArr.filter(
      (ans, i) => i !== idxToDel
    );
    const newCorIdx = idxToDel > corIdx ? 
      corIdx 
      : idxToDel > 0 ? 
      corIdx - 1 
      : 0;
    return onChangeAnswer({correctIndex: newCorIdx, answers: updatedAnsArr}, questionIdx);
  }

  const onAdd = () => {
    return onChangeAnswer({correctIndex: corIdx, answers: [...ansArr, ""]}, questionIdx);
  }

  useEffect(() => {
    let errArr = ansArr.map(a => a !== "" ? null : "Please enter an answer");
    const dup = ansArr.map(a => []);
    for(let i = 0; i < ansArr.length; i++) {
      const searchIdx = ansArr.indexOf(ansArr[i]);
      if(i !== searchIdx && ansArr[i] !== "") {
        dup[i].push(searchIdx);
        dup[searchIdx].push(i);
      }
    }
    errArr = errArr.map((e, idx) => {
      if(dup[idx].length > 0 && e === null) {
        let errMsg = "Duplicate answer with " + [dup[idx][0] + 1];
        for(let i = 1; i < dup[idx].length; i++) {
          errMsg += ", " + [dup[idx][i] + 1];
        }
        return errMsg;
      }
      return e;
    });
    setErrAns(errArr);
    setSubmitMsg({msg: "", isSuccess: false});
  }, [ansObj]);

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {ansArr.map((answer, idx) => 
        <div key={idx} className={styles.form__answer}>
          <Image
            src={corIdx === idx ? iconCheck : iconX}
            alt={corIdx === idx ? "Correct answer" : "Wrong answer"}
            onClick={() => onClickCorrect(idx)}
            className={styles.form__answer__icon}
            />
          <div className={styles.form__answer__num}>{idx + 1}.</div>
          <div className={styles.form__answer__cont}>
            <input 
              key={idx}
              className={errAns[idx] ? 
                `${styles.form__answer__input} ${styles.err_border}`
                :
                styles.form__answer__input
              }
              type="text"
              placeholder={"Answer " + [idx + 1]}
              value={answer}
              onInput={(e) => onInput(e, idx)}
            />
            <StatusTextbox msg={errAns[idx]}/>
          </div>
          {ansArr.length > 1 ?
            <div className={styles.form__delete}>
              <DeleteBtn
                itemIdx={idx}
                onClick={onDelete}
              />
            </div>
            : <></>
          }
        </div>)}
      <div className={styles.footer}>
        {ansArr.length < MAX_ANSWER_NUM ? 
          <div className={styles.footer__add_answer} onClick={onAdd}>
            <Image
              src={iconPlus}
              alt="Plus icon"
              className={styles.footer__add_answer__icon}
            />
            <div className={styles.footer__add_answer__text}>Add Answer</div>
          </div>
          :
          <div></div>
        }
        <CreateQuestBtn msg={submitMsg.msg} isSuccess={submitMsg.isSuccess}/>
      </div>
    </form>
  )
}