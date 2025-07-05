export const getUser = async () => {
    let user = null;
    let avatar = '';
    try {
        const response = await fetch("http://localhost:8000/profile", { credentials: "include" });
        const data = await response.json();
        if (response.ok) {
            user = data;
            if (data.images?.length > 0) {
                const imageUrl = data.images[0];
                avatar = (imageUrl.startsWith("http") ? imageUrl : `http://localhost:8000${imageUrl}`);
            }
        }
        return { user, avatar };
    } catch (error) {
        console.error(error);
    }
}