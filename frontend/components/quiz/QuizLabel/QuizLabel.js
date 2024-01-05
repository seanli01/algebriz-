import "./QuizLabel.css";
import AddQuizForm from "@/components/Quiz/AddQuizForm/AddQuizForm";
import AddQuest from "@/components/AddQuest/AddQuest";
import { useState, useEffect } from "react";
import ConfirmPrompt from "@/components/ConfirmPrompt/ConfirmPrompt";
import Image from "next/image";
import iconPlay from "@/public/play.svg";
import iconLock from "@/public/lock.svg";
import iconGlobe from "@/public/globe.svg";
import iconEdit from "@/public/edit.svg";
import iconDelete from "@/public/trash_icon.svg";
import { useSocket } from "@/components/Multiplayer/SocketContext";
import { useUserContext } from "@/app/(headFootLayout)/layout";
import { useRouter } from "next/navigation";

export default function QuizLabel({ quiz, changeQuizVis, editQuiz, deleteQuiz }) {
    const [ editing, setEditing ] = useState(false);
    const [ visPromptVisable, setVisPromptVisable ] = useState(false);
    const [ delPromptVisable, setDelPromptVisable ] = useState(false);
    const { socket, sessionCode } = useSocket();
    const username = useUserContext();
    const router = useRouter();

    const onClickVis = () => {
        return setVisPromptVisable(true);
    }

    const handleVisChange = () => {
        setVisPromptVisable(false);
        if (quiz.isPublic) return changeQuizVis(quiz._id, false);
        return changeQuizVis(quiz._id, true);
    }

    return (
        <div className="quiz" id={"quiz"+quiz._id}>
            <div className="quiz-header">
                <div className="quiz-left-cont">
                    <div className="quiz-left-top">
                        <div className="quiz-title">{quiz.title}</div>
                        <div className="quiz-owner">{"by " + quiz.ownerId}</div>
                    </div>
                    <div className="quiz-desc">{quiz.desc}</div>
                </div>
                
                <div className="quiz-buttons">
                    <Image
                        src={iconPlay}
                        alt={"Play quiz"}
                        className="icon"
                        onClick={()=>{
                            router.push(`/quizzes/${quiz._id}`);
                            socket.emit('start quiz', { code: sessionCode, quizId: quiz._id, userId: username });
                        }}
                    />
                    { typeof changeQuizVis === "function" ? 
                        <Image
                            src={quiz.isPublic ? iconGlobe : iconLock}
                            alt={quiz.isPublic ? "Make private" : "Make public"}
                            className="icon"
                            onClick={onClickVis}
                        />
                        :
                        <></>
                    }
                    { typeof editQuiz === "function" ?
                        <Image
                            src={iconEdit}
                            alt={"Edit quiz"}
                            className="icon"
                            onClick={()=>{ editing ? setEditing(false) : setEditing(true)}}
                        />
                        :
                        <></>
                    }
                    { typeof deleteQuiz === "function" ?
                        <Image
                            src={iconDelete}
                            alt={"Delete quiz"}
                            className="icon red-background"
                            onClick={()=>{setDelPromptVisable(true)}}
                        />
                        :
                        <></>
                    }
                </div>
            </div>
            { editing ?
                <div className="quiz-edit">
                    <AddQuizForm
                        edit={true}
                        cancel={() => setEditing(false)}
                        addQuiz={(title, desc) => editQuiz(quiz._id, title, desc)}
                        title={quiz.title}
                        desc={quiz.desc}
                    />
                    <AddQuest
                        quizId={quiz._id}
                    />
                </div>
                :
                <></>
            }
            { visPromptVisable ?
                <ConfirmPrompt
                    title={`Make "${quiz.title}" ${quiz.isPublic ? "private" : "public"}?`}
                    subtitle={`This quiz ${quiz.isPublic ? "will not" : "will"} appear in Browse Quizzes for other users!`}
                    conText={quiz.isPublic ? "Make private" : "Make public"}
                    rejText={"Cancel"}
                    onCon={handleVisChange}
                    onRej={() => setVisPromptVisable(false)}
                />
                :
                <></>
            }
            { delPromptVisable ?
                <ConfirmPrompt
                    title={`Delete "${quiz.title}"?`}
                    subtitle={`All questions and answers will be lost!`}
                    conText={"Delete"}
                    rejText={"Cancel"}
                    onCon={() => deleteQuiz(quiz._id)}
                    onRej={() => setDelPromptVisable(false)}
                />
                :
                <></>
            }
        </div>
    )
}