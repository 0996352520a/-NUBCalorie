// โหลดข้อมูลเดิมที่เคยบันทึกไว้ในเครื่องตอนเปิดแอป
window.onload = () => {
    loadProfile();
};

function saveProfile() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const activity = document.getElementById('activity').value;

    if(!weight || !height || !age) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    // คำนวณ BMI
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    // คำนวณ BMR และ TDEE
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male') ? 5 : -161;
    const tdee = Math.round(bmr * parseFloat(activity));

    // บันทึกลง Local Storage ของมือถือ
    localStorage.setItem('fitbite_profile', JSON.stringify({weight, height, age, gender, activity, bmi, tdee}));
    
    updateDashboard(bmi, tdee);
    alert("บันทึกข้อมูลเรียบร้อย!");
}

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('fitbite_profile'));
    const calories = localStorage.getItem('fitbite_calories') || 0;
    document.getElementById('calDisplay').innerText = calories;

    if(profile) {
        document.getElementById('weight').value = profile.weight;
        document.getElementById('height').value = profile.height;
        document.getElementById('age').value = profile.age;
        document.getElementById('gender').value = profile.gender;
        document.getElementById('activity').value = profile.activity;
        updateDashboard(profile.bmi, profile.tdee);
    }
}

function updateDashboard(bmi, tdee) {
    document.getElementById('bmiDisplay').innerText = bmi;
    document.getElementById('tdeeDisplay').innerText = tdee;
}

function resetCalories() {
    if(confirm("ต้องการรีเซ็ตแคลอรีของวันนี้ใช่หรือไม่?")) {
        localStorage.setItem('fitbite_calories', 0);
        document.getElementById('calDisplay').innerText = 0;
    }
}

// ระบบ AI วิเคราะห์ภาพ
async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden'); // เปิดหน้าโหลด

    // แปลงภาพเป็น Base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result.split(',')[1];
        
        // ===== ใส่ API KEY ของ OPENAI ที่นี่ =====
        const apiKey = "ใส่_API_KEY_ของคุณตรงนี้"; 
        
        if(apiKey === "ใส่_API_KEY_ของคุณตรงนี้") {
            // ระบบจำลองกรณีไม่มี API Key
            setTimeout(() => {
                addCalories(450, "ข้าวกะเพราไก่ไข่ดาว (ระบบจำลอง)");
            }, 2000);
            return;
        }

        try {
            // ยิงข้อมูลไปหา OpenAI
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "นี่คืออาหารอะไร ประเมินแคลอรีให้หน่อย ตอบกลับมาแค่ตัวเลขแคลอรีและชื่ออาหาร เช่น '450, ข้าวมันไก่'" },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                            ]
                        }
                    ],
                    max_tokens: 50
                })
            });

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            
            // ดึงตัวเลขแคลอรีออกมา (สมมติว่า AI ตอบ "450, ข้าวมันไก่")
            const calMatch = resultText.match(/\d+/); 
            if(calMatch) {
                addCalories(parseInt(calMatch[0]), resultText);
            } else {
                alert("AI อ่านแคลอรีไม่ออก กรุณาถ่ายใหม่");
                document.getElementById('loading').classList.add('hidden');
            }
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
            document.getElementById('loading').classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function addCalories(cal, foodName) {
    document.getElementById('loading').classList.add('hidden');
    let currentCal = parseInt(localStorage.getItem('fitbite_calories') || 0);
    currentCal += cal;
    localStorage.setItem('fitbite_calories', currentCal);
    document.getElementById('calDisplay').innerText = currentCal;
    alert(`วิเคราะห์สำเร็จ: ${foodName}\nบวกเพิ่ม ${cal} kcal`);
}
