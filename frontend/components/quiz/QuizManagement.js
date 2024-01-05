﻿"use client";
import "./QuizManagement.css"
import { useState, useEffect } from "react";
import { useUserContext } from "@/app/(headFootLayout)/layout";
import QuizList from "@/components/Quiz/QuizList/QuizList";
import AddQuizForm from "@/components/Quiz/AddQuizForm/AddQuizForm";
import CreateSessionButton from "@/components/Multiplayer/CreateSessionButton";
import JoinSessionForm from "@/components/Multiplayer/JoinSessionForm/JoinSessionForm";
import { useSocket } from "@/components/Multiplayer/SocketContext";
import { getQuizzes, addQuiz, editQuiz, deleteQuiz, editQuizVisibility, getAllQuizzes } from "@/api/api.mjs";

export default function QuizManagement({ isBrowsing }) {
    const user = useUserContext();
    const [quizzes, setQuizzes] = useState([]);
    const [addingQuiz, setAddingQuiz] = useState(false);
    const [page, setPage] = useState(1);
    const [nextExist, setNextExist] = useState(false);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        async function updateQuizList() {
            if (user) {
                checkNextPage(page + 1);
                let response;
                if (isBrowsing) response = await getAllQuizzes(page);
                else response = await getQuizzes(user, page);
                const data = await response.json();
                setQuizzes(data);
            }
            else {
                setQuizzes([]);
            }
            setLoading(false);
        }
        updateQuizList()
    }, [user]);

    const checkNextPage = async (pageToCheck) => {
        if (user) {
            let response;
            if (isBrowsing) response = await getAllQuizzes(pageToCheck);
            else response = await getQuizzes(user, pageToCheck);
            const data = await response.json();
            return setNextExist(data.length !== 0);
        }
    }

    const updateData = async () => {
        let response = await getQuizzes(user, page); // get updated quizzes
        let data = await response.json();
        return setQuizzes(data);
    }

    const handleAddQuiz = async (title, desc) => {
        return addQuiz(title, desc).then(updateData);
    }

    const handleEditQuiz = async (quizId, title, desc) => {
        return editQuiz(quizId, title, desc).then(updateData);
    }

    const handleChangeQuizVis = async (quizId, isPublic) => {
        return editQuizVisibility(quizId, isPublic).then(updateData);
    }

    const handleDeleteQuiz = async (quizId) => {
        return deleteQuiz(quizId).then(updateData);
    }

    const nextPage = async () => {
        checkNextPage(page + 2);
        let response;
        if (isBrowsing) response = await getAllQuizzes(page + 1);
        else response = await getQuizzes(user, page + 1);
        const data = await response.json();
        if (data.length !== 0) {
            setAddingQuiz(false);
            setQuizzes(data);
            setPage(page + 1);
        }
    }

    const prevPage = async () => {
        if (page > 1) {
            setNextExist(true);
            let response;
            if (isBrowsing) response = await getAllQuizzes(page - 1);
            else response = await getQuizzes(user, page - 1);
            const data = await response.json();
            setAddingQuiz(false);
            setQuizzes(data);
            setPage(page - 1);
        }
    }

    return (
        user ?              // Only display quiz management when signed in 
            <>
                { !isBrowsing ?   // Show editing options when not browsing
                    <>
                        <QuizList
                            quizzes={quizzes}
                            changeQuizVis={(id, isPublic) => handleChangeQuizVis(id, isPublic)}
                            editQuiz={((id, title, desc) => handleEditQuiz(id, title, desc))}
                            deleteQuiz={(id => handleDeleteQuiz(id))}
                            isLoading={loading}
                        />
                        { addingQuiz ?
                            <AddQuizForm
                                edit={false}
                                cancel={() => setAddingQuiz(false)}
                                addQuiz={(title, desc) => handleAddQuiz(title, desc).then(setAddingQuiz(false))}
                            />
                            :
                            <></>
                        }
                    </>
                :
                    <QuizList
                        quizzes={quizzes}
                        isLoading={loading}
                    />
                }
                <div className="page-btns">
                    <button className={`btn ${page > 1 ? "" : "hidden"}`} type="button" onClick={() => prevPage()}>Previous</button>
                    { addingQuiz || isBrowsing ? <></> :
                        <button className="btn" type="button" onClick={() => setAddingQuiz(true)}>Add a quiz</button>
                    }
                    <button className={`btn ${nextExist ? "" : "hidden"}`} type="button" onClick={() => nextPage()}>Next</button>
                </div>
                <div className="page-text">Page {page}</div>
                <div className="session-section">
                    <CreateSessionButton/>
                </div>
            </>
        : 
        <></>
    )
}