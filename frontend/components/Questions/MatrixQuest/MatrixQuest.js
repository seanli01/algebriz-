import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./MatrixQuest.module.css";
import StatusTextbox from "@/components/StatusTextbox/StatusTextbox";
import CreateQuestBtn from "../CreateQuestBtn/CreateQuestBtn";
import iconPlus from "@/public/plus_icon.svg";
import iconMinus from "@/public/minus_icon.svg";

const MAX_SIDE_LEN = 5;
const MSG_INVALID_NUM = "Matrix can only take numbers";
const MSG_EMPTY_CELL = "Please fill in all cells";
const MSG_WARN_DELETE_ROW = "NOTE: Reducing rows will delete all data from the bottom row";
const MSG_WARN_DELETE_COL = "NOTE: Reducing columns will delete all data from the right column";
const MSG_SERVER_ERR = "There was an error saving";

export default function MatrixQuest({ questionIdx, ansMatrix, onChangeAnswer, onVerifiedSubmit }) {
  const [rowMsg, setRowMsg] = useState("");
  const [colMsg, setColMsg] = useState("");
  const [errArr, setErrArr] = useState([[]]);
  const [submitMsg, setSubmitMsg] = useState({msg: "", isSuccess: false});
  const numOfRows = ansMatrix 
    ? ansMatrix.length
    : 2;
  const numOfCols = ansMatrix 
    ? ansMatrix[0].length
    : 2;
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${numOfCols}, minmax(45px, 1fr))`,
    gridTemplateRows: `repeat(${numOfRows}, minmax(45px, 0.5fr))`,
    padding: "10px"
  }
  /* 
  Styling grid with minmax, taken from this 
  Sitepoint article by Ralph Mason, posted on August 2, 2023
  https://www.sitepoint.com/css-grid-repeat-function/#usingtheminmaxfunctionwithrepeat  
  */

  const onAddRow = () => {
    if(numOfRows >= MAX_SIDE_LEN) return;
    const newRow = [];
    for(let i = 0; i < numOfCols; i++) newRow.push("");
    return onChangeAnswer({correctIndex: 0, answers: [[...ansMatrix, newRow]]}, questionIdx);
  }

  const onAddCol = () => {
    if(numOfCols >= MAX_SIDE_LEN) return;
    const updatedAnsMat = [...ansMatrix];
    for(let row of updatedAnsMat) row.push("");
    return onChangeAnswer({correctIndex: 0, answers: [updatedAnsMat]}, questionIdx);
  }

  const onDelRow = () => {
    if(numOfRows <= 1) return;
    const updatedAnsMat = [];
    for(let i = 0; i < numOfRows - 1; i++) updatedAnsMat.push(ansMatrix[i]);
    return onChangeAnswer({correctIndex: 0, answers: [updatedAnsMat]}, questionIdx);
  }

  const onDelCol = () => {
    if(numOfCols <= 1) return;
    const updatedAnsMat = [];
    for(let row of ansMatrix) {
      updatedAnsMat.push(row.filter((c, i) => i !== numOfCols - 1));
    }
    return onChangeAnswer({correctIndex: 0, answers: [updatedAnsMat]}, questionIdx);
  }

  const onInput = (e, rowIdx, colIdx) => {
    const updatedAnsMat = [...ansMatrix];
    setErrArr(errArr.map(
      (row, rowI) => {
        if(row && rowI === rowIdx) return row.map((item, colI) => colI === colIdx ? false : item)
        return row;
      }
    ));
    updatedAnsMat[rowIdx][colIdx] = e.target.value;
    return onChangeAnswer({correctIndex: 0, answers: [updatedAnsMat]}, questionIdx);
  }

  const onSubmit = () => {
    const updatedErrArr = [];
    let foundErr = false;
    for(let row of ansMatrix) {
      updatedErrArr.push(row.map(item => {
        if(isNaN(item)) {
          foundErr = true;
          return true;
        }
        return false;
      }));
    }
    if(foundErr) {
      setErrArr(updatedErrArr);
      return setSubmitMsg({msg: MSG_INVALID_NUM, isSuccess: false});
    }
    updatedErrArr.splice(0, updatedErrArr.length);
    for(let row of ansMatrix) {
      updatedErrArr.push(row.map(item => {
        if(!item) {
          foundErr = true;
          return true;
        }
        return false;
      }));
    }
    if(foundErr) {
      setErrArr(updatedErrArr);
      return setSubmitMsg({msg: MSG_EMPTY_CELL, isSuccess: false});
    }
    return onVerifiedSubmit(questionIdx, {correctIndex: 0, answers: [ansMatrix]})
      .then(() => setSubmitMsg({msg: "Saved", isSuccess: true}))
      .catch(err => setSubmitMsg({msg: err, isSuccess: false}));
  }

  useEffect(() => {
    setSubmitMsg({msg: "", isSuccess: false});
    if(numOfRows === 1) setRowMsg("");
    else {
      for(let i = 0; i <= numOfCols; i++) {
        if(i === numOfCols) {
          setRowMsg("");
          break;
        }
        if(ansMatrix[numOfRows - 1][i] !== "" && ansMatrix[numOfRows - 1][i] != null) {
          setRowMsg(MSG_WARN_DELETE_ROW);
          break;
        }
      }
    }
    if(numOfCols === 1) setColMsg("");
    else {
      for(let i = 0; i <= numOfRows; i++) { 
        if(i === numOfRows) {
          setColMsg("");
          break;
        }
        if(ansMatrix[i][numOfCols - 1] !== "" && ansMatrix[i][numOfCols - 1] != null) {
          setColMsg(MSG_WARN_DELETE_COL);
          break;
        }
      }
    }
  }, [ansMatrix]);

  return (
    <div className={styles.cont}>
      <div className={styles.opts}>
        <div className={styles.opts__input_and_msg_cont}>
          <div className={styles.opts__input_cont}>
            <div className={styles.opts__btn_cont}>
              <Image
                src={iconPlus}
                alt="Add row"
                className={numOfRows < MAX_SIDE_LEN ? styles.opts__btn : `${styles.opts__btn} ${styles.hidden}`}
                onClick={onAddRow}
              />
              <Image
                src={iconMinus}
                alt="Delete row"
                className={numOfRows > 1 ? styles.opts__btn : `${styles.opts__btn} ${styles.hidden}`}
                onClick={onDelRow}
              />
            </div>
            <div className={styles.opts__num}>{numOfRows}</div>
            <div>{numOfRows > 1 ? "Rows" : "Row"}</div>
          </div>
          <StatusTextbox msg={rowMsg} color={"yellow"}/>
        </div>
        <div className={styles.opts__input_and_msg_cont}>
          <div className={styles.opts__input_cont}>
            <div className={styles.opts__btn_cont}>
              <Image
                src={iconPlus}
                alt="Add col"
                className={numOfCols < MAX_SIDE_LEN ? styles.opts__btn : `${styles.opts__btn} ${styles.hidden}`}
                onClick={onAddCol}
              />
              <Image
                src={iconMinus}
                alt="Delete row"
                className={numOfCols > 1 ? styles.opts__btn : `${styles.opts__btn} ${styles.hidden}`}
                onClick={onDelCol}
              />
            </div>
            <div className={styles.opts__num}>{numOfCols}</div>
            <div>{numOfCols > 1 ? "Columns" : "Column"}</div>
          </div>
          <StatusTextbox msg={colMsg} color={"yellow"}/>
        </div>
      </div>
      <div className={styles.right_cont}>
        <div className={styles.matrix_cont}>
          <div className={styles.matrix_center_cont}>
            <div className={`${styles.matrix__sides} ${styles.left}`}></div>
            <div style={gridStyle}>
              {ansMatrix.map((row, rowIdx) => 
                row.map((num, colIdx) => 
                  <input
                    key={`${rowIdx} ${colIdx}`}
                    type="text"
                    inputMode="numeric"
                    placeholder={`(${colIdx + 1}, ${rowIdx + 1})`}
                    className={!errArr[rowIdx] 
                      ? styles.matrix__cell
                      : errArr[rowIdx][colIdx] 
                      ? `${styles.matrix__cell} ${styles.err}`
                      : styles.matrix__cell}
                    value={num}
                    onInput={(e) => onInput(e, rowIdx, colIdx)}
                  />
                )
              )}
            </div>
            <div className={`${styles.matrix__sides} ${styles.right}`}></div>
          </div>
        </div>
        <CreateQuestBtn
          msg={submitMsg.msg}
          onClick={onSubmit}
          isSuccess={submitMsg.isSuccess}
        />
      </div>
     
    </div>
  )
}