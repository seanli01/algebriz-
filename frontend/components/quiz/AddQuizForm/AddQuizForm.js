import "./AddQuizForm.css";
import { useEffect, useRef, useState } from "react";

export default function AddQuizForm({ edit, addQuiz, cancel, title, desc }) {
    const [curTitle, setCurTitle] = useState("");
    const [curDesc, setCurDesc] = useState("");
    const titleRef = useRef(null);
    const descRef = useRef(null);

    const handleOnInput = (e) => {
        if (e.target.name === "title") return setCurTitle(e.target.value);
        if (e.target.name === "desc") return setCurDesc(e.target.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        // get values from refs
        const title = titleRef.current.value;
        const desc = descRef.current.value;
        addQuiz(title, desc).then(() => {
            e.target.reset();
        });
    }

    useEffect(() => {
        if (title) setCurTitle(title);
        if (desc) setCurDesc(desc);
    }, []);

    return (
        <form className="form" onSubmit={handleSubmit}>
            { edit ?
                <div className="form-title">Editing quiz</div>
                :
                <div className="form-title">Create a quiz</div>
            }
            <input
                type="text"
                id="quiz-title"
                className="form-input-title"
                name="title"
                placeholder="Enter a quiz title"
                value={curTitle}
                onInput={handleOnInput}
                required
                ref={titleRef}
            />
            <textarea
                rows="5"
                id="quiz-description"
                className="form-input-desc"
                name="desc"
                placeholder="Enter a quiz description"
                value={curDesc}
                onInput={handleOnInput}
                ref={descRef}
            ></textarea>
            <div className="form-btns">
                { edit ?
                    <button className="btn" type="submit">Save</button>
                    :
                    <button className="btn" type="submit">Create</button>
                }
                <button className="btn" onClick={() => cancel()}>Close</button>
            </div>
        </form>
    )
}