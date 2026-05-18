export default defineEventHandler(async (event) => {
    try {
        // 🔥 請將下方網址替換成您剛剛在 Hugging Face 建立的 Space 網址
        // 格式通常為：https://您的帳號-專案名稱.hf.space/api/tmf
        const hfApiUrl = 'https://lawxstudents168-macrowave-scrape-api.hf.space/api/tmf'; 
        
        const response = await fetch(hfApiUrl);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Hugging Face API 請求失敗');
        }
        
        return data;

    } catch (error: any) {
        return { success: false, message: error.message };
    }
});
