import { useState } from "react";

const useForm = () => {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [address, setAddress] = useState("");
    const [school, setSchool] = useState("");
    const [image, setImage] = useState("");
    return {
        name,
        setName,
        password,
        setPassword,
        loading,
        setLoading,
        phone,
        setPhone,
        age,
        setAge,
        school,
        setSchool,
        address,
        setAddress,
        image,
        setImage,
        confirmPassword,
        setConfirmPassword,
    };
};

export default useForm;
