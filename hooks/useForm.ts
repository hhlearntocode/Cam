import { useState } from "react";

const useForm = () => {
    const [emailAccount, setEmailAccount] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    return {
        emailAccount,
        setEmailAccount,
        password,
        setPassword,
        loading,
        setLoading,
    };
};

export default useForm;
