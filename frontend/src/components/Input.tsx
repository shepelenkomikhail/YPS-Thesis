import {ChangeEvent, ReactNode, useState} from "react";

interface InputProps {
    type: string;
    placeholder: string;
    pattern?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    svg?: ReactNode;
    typeToggler?: () => void;
    value?: string;
    name?: string;
}

export default function Input({ type, placeholder, pattern, onChange, svg, typeToggler , value, name}: InputProps) {
    const [touched, setTouched] = useState(false);
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    const getDialogMessage = (type: string) => {
        switch (type) {
            case "text":
                return "Only lowercase letters and numbers";
            case "email":
                return "Email format";
            case "password":
                return "8+ characters, uppercase letter, number and special character";
            case "name":
                return "Only 3-20 letters";
            case "verification":
                return "6 digits code";
            default:
                return "This field is required";
        }
    };

    return (
        <div className={"relative w-9/12 2xl:w-1/2"}>
            <input type={type} placeholder={placeholder} onChange={onChange} pattern={pattern} value={value} name={name} required
                   onFocus={() => {
                       setTouched(true);
                       setIsDialogVisible(true);
                   }}
                   onBlur={() => {
                       setTouched(true);
                       setIsDialogVisible(false);
                   }}
                   className={`w-full bg-gray-50 border border-gray-600 rounded-md p-2 pl-4 focus:outline-0
                focus:border-blue-500 focus:border-2 dark:bg-darkinput dark:text-secondarydarktext
                ${touched && !document.activeElement?.matches('input:focus') && 
                   'invalid:border-pink-600 focus:invalid:border-pink-600 ' +
                   'focus:invalid:ring-pink-600'}`}
            />
            {isDialogVisible && (
                <div className={"ml-2 mt-1 absolute w-full text-left "}>
                    <p className={"text-xs text-gray-600 dark:text-secondarydarktext"}>{getDialogMessage(type)}</p>
                </div>
            )}
            {svg && (
                <div className={"absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-105 transition cursor-pointer"} onClick={typeToggler}>
                    {svg}
                </div>
            )}
        </div>
    );
}