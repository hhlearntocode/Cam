import { useState } from "react";

const useForm = () => {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [address, setAddress] = useState("");
    const [school, setSchool] = useState("");
    const [image, setImage] = useState("");
    const [classes, setClasses] = useState("");
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
        classes,
        setClasses,
    };
};

export default useForm;