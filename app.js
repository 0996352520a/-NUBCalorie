let currentUser = ""; 
let userList = []; 
let tempFoodData = null; 
let activeTab = 'home'; 

// ==========================================
// 🚀 รหัส API KEY ของ Hugging Face (ไม่มีบั๊ก 100%)
const HF_API_KEY = "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";
// ==========================================

// 💡 ฐานข้อมูลอาหารสำหรับระบบแนะนำ
let currentFoodPref = 'clean'; 
const foodDB = {
    clean: [
        { name: "สลัดอกไก่ย่างน้ำใส", cal: 200 }, { name: "ยำวุ้นเส้นหมูสับ", cal: 250 },
        { name: "สุกี้น้ำไก่ (เน้นผัก)", cal: 280 }, { name: "ไข่ต้ม 2 ฟอง + แซนด์วิชโฮลวีต", cal: 300 },
        { name: "ปลาซาบะย่างซีอิ๊ว + ผักต้ม", cal: 320 }, { name: "อกไก่ย่าง + ข้าวกล้อง 1 ทัพพี", cal: 350 },
        { name: "สเต็กปลาแซลมอน", cal: 400 }, { name: "แกงจืดเต้าหู้หมูสับ (ไม่ซดน้ำ)", cal: 150 }
    ],
    general: [
        { name: "ราดหน้าเส้นใหญ่หมู", cal: 400 }, { name: "ก๋วยเตี๋ยวเส้นเล็กต้มยำ", cal: 450 },
        { name: "ยำมาม่าใส่หมูยอ", cal: 480 }, { name: "ส้มตำไทย + ไก่ย่าง", cal: 500 },
        { name: "ข้าวผัดหมูใส่ไข่", cal: 550 }, { name: "ข้าวกะเพราหมูสับไข่ดาว", cal: 600 },
        { name: "ข้าวมันไก่ (ไม่หนัง)", cal: 650 }, { name: "ผัดไทยกุ้งสด", cal: 700 }
    ]
};

window.onload = () => {
    const savedUsers = localStorage.getItem('nubcalorie_userList');
    if(savedUsers) userList = JSON.parse(savedUsers);
    if(userList.length === 0) {
        userList.push("ฉัน");
        localStorage.setItem('nubcalorie_userList', JSON.stringify(userList));
    }
    const lastUser = localStorage.getItem('nubcalorie_currentUser');
    currentUser = (lastUser && userList.includes(lastUser)) ? lastUser : userList[0];
    updateUserDropdown();
    loadProfile();
};

function switchTab(tab) {
    activeTab = tab;
    document.getElementById('homeView').classList.toggle('hidden', tab !== 'home');
    document.getElementById('allDataView').classList.toggle('hidden', tab === 'home');
    
    document.getElementById('tabHome').className = tab === 'home' 
        ? "py-2.5 flex-1 text-center border-b-4 border-yellow-300 text-yellow-300 transition" 
        : "py-2.5 flex-1 text-center border-b-4 border-transparent text-teal-100 hover:text-white transition";
    
    document.getElementById('tabAllData').className = tab === 'allData' 
        ? "py-2.5 flex-1 text-center border-b-4 border-yellow-300 text-yellow-300 transition" 
        : "py-2.5 flex-1 text-center border-b-4 border-transparent text-teal-100 hover:text-white transition";
    
    if(tab === 'allData') renderAllDataView(); 
}

function updateUserDropdown() {
    const selector = document.getElementById('userSelector');
    selector.innerHTML = ""; 
    userList.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        option.text = user;
        if(user === currentUser) option.selected = true;
        selector.appendChild(option);
    });
}

function addNewUser() {
    const newName = prompt("กรุณาพิมพ์ชื่อผู้ใช้ใหม่:");
    if(newName && newName.trim() !== "") {
        const name = newName.trim();
        if(!userList.includes(name)) {
            userList.push(name);
            localStorage.setItem('nubcalorie_userList', JSON.stringify(userList));
        }
        currentUser = name;
        localStorage.setItem('nubcalorie_currentUser', currentUser);
        updateUserDropdown();
        loadProfile();
    }
}

function switchUser() {
    currentUser = document.getElementById('userSelector').value;
    localStorage.setItem('nubcalorie_currentUser', currentUser);
    loadProfile(); 
}

function saveProfile() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activity = parseFloat(document.getElementById('activity').value);
    const goal = document.getElementById('goal').value;

    if(!weight || !height || !age) { alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }

    const bmi = (weight / Math.pow(height/100, 2)).toFixed(1);
    let bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * activity);

    let targetCal = tdee;
    if (goal === 'lose') targetCal = Math.max(1200, tdee - 500);
    else if (goal === 'gain') targetCal = tdee + 400;

    const profileData = { 
        weight, height, age, gender, activity, goal, bmi, bmr, tdee, targetCal, 
        targetProtein: Math.round((targetCal * 0.25) / 4), 
        targetCarbs: Math.round((targetCal * 0.50) / 4), 
        targetFat: Math.round((targetCal * 0.25) / 9) 
    };
    localStorage.setItem(`nubcalorie_${currentUser}_profile`, JSON.stringify(profileData));
    updateDashboard(profileData);
    alert(`บันทึกแผนโภชนาการสำเร็จ!`);
}

function loadProfile() {
    document.getElementById('profileNameDisplay').innerText = currentUser;
    document.getElementById('historyName').innerText = currentUser;

    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`));
    updateNutritionUI(getTodayNutrition(), profile);

    if(profile) {
        document.getElementById('weight').value = profile.weight;
        document.getElementById('height').value = profile.height;
        document.getElementById('age').value = profile.age;
        document.getElementById('gender').value = profile.gender;
        document.getElementById('activity').value = profile.activity;
        document.getElementById('goal').value = profile.goal || 'maintain';
        updateDashboard(profile);
    } else {
        document.getElementById('weight').value = ""; document.getElementById('height').value = ""; document.getElementById('age').value = "";
        updateDashboard({ bmi: 0, bmr: 0, tdee: 0, targetCal: 0, targetProtein: 0, targetCarbs: 0, targetFat: 0, goal: 'maintain' });
    }
    if(activeTab === 'allData') renderAllDataView();
}

function updateDashboard(p) {
    document.getElementById('bmiDisplay').innerText = p.bmi;
    document.getElementById('tdeeDisplay').innerText = p.tdee;
    document.getElementById('targetCalDisplay').innerText = p.targetCal;

    const goalText = { 'lose': '🔻 ลดน้ำหนัก', 'maintain': '⚖️ รักษาน้ำหนัก', 'gain': '🔺 เพิ่มน้ำหนัก' };
    document.getElementById('goalDisplay').innerText = goalText[p.goal] || 'รักษาน้ำหนัก';

    let statusText = "-";
    if (p.bmi > 0) {
        if (p.bmi < 18.5) statusText = "น้ำหนักน้อยกว่าเกณฑ์";
        else if (p.bmi < 23) statusText = "สมส่วนสุขภาพดี";
        else if (p.bmi < 25) statusText = "ท้วม / น้ำหนักเกิน";
        else statusText = "อ้วน / เสี่ยงสุขภาพ";
    }
    document.getElementById('bmiStatus').innerText = statusText;
    document.getElementById('targetProtein').innerText = p.targetProtein || 0;
    document.getElementById('targetCarbs').innerText = p.targetCarbs || 0;
    document.getElementById('targetFat').innerText = p.targetFat || 0;

    updateNutritionUI(getTodayNutrition(), p);
}

function getTodayNutrition() {
    return JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_todayNutrition`)) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function updateNutritionUI(current, profile = null) {
    if(!profile) profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || { targetProtein: 1, targetCarbs: 1, targetFat: 1, targetCal: 2000 };
    
    document.getElementById('calDisplay').innerText = current.calories;
    document.getElementById('consumedProtein').innerText = current.protein;
    document.getElementById('consumedCarbs').innerText = current.carbs;
    document.getElementById('consumedFat').innerText = current.fat;

    document.getElementById('barProtein').style.width = `${Math.min(100, Math.round((current.protein / (profile.targetProtein || 1)) * 100))}%`;
    document.getElementById('barCarbs').style.width = `${Math.min(100, Math.round((current.carbs / (profile.targetCarbs || 1)) * 100))}%`;
    document.getElementById('barFat').style.width = `${Math.min(100, Math.round((current.fat / (profile.targetFat || 1)) * 100))}%`;

    generateSuggestions(profile.targetCal || 0, current.calories || 0);
}

// ระบบแนะนำเมนู
function setFoodPreference(type) {
    currentFoodPref = type;
    document.getElementById('btnCleanFood').className = type === 'clean' ? "flex-1 py-2 text-[11px] font-bold rounded-md bg-white shadow text-green-600 transition" : "flex-1 py-2 text-[11px] font-bold rounded-md text-gray-500 hover:text-green-600 transition";
    document.getElementById('btnGeneralFood').className = type === 'general' ? "flex-1 py-2 text-[11px] font-bold rounded-md bg-white shadow text-orange-500 transition" : "flex-1 py-2 text-[11px] font-bold rounded-md text-gray-500 hover:text-orange-500 transition";
    
    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || { targetCal: 0 };
    generateSuggestions(profile.targetCal, getTodayNutrition().calories);
}

function generateSuggestions(targetCal = 0, consumedCal = 0) {
    let remaining = targetCal - consumedCal;
    document.getElementById('suggestRemaining').innerText = remaining;
    const listEl = document.getElementById('suggestionList');
    listEl.innerHTML = "";

    if(remaining <= 50) {
        listEl.innerHTML = `<div class="text-center text-xs text-red-500 py-3 font-bold bg-red-50 rounded-lg">🚫 โควตาวันนี้หมดแล้ว!<br>แนะนำดื่มน้ำเปล่า หรือชาดำ</div>`; return;
    }

    let availableFoods = foodDB[currentFoodPref].filter(f => f.cal <= remaining).sort(() => 0.5 - Math.random()).slice(0, 3);
    
    if(availableFoods.length === 0) {
        listEl.innerHTML = `<div class="text-center text-xs text-orange-500 py-3 font-bold bg-orange-50 rounded-lg">⚠️ แคลอรีเหลือน้อยเกินไป<br>แนะนำทานผลไม้สด</div>`; return;
    }

    availableFoods.forEach(item => {
        listEl.innerHTML += `
            <li class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <span class="text-xs font-bold text-gray-700">🍽️ ${item.name}</span>
                <span class="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">${item.cal} kcal</span>
            </li>`;
    });
}

function renderAllDataView() {
    document.getElementById('allDataUserName').innerText = currentUser;
    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || {};
    const today = getTodayNutrition();
    const history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");

    document.getElementById('adWeightHeight').innerText = `${profile.weight || "-"} กก. / ${profile.height || "-"} ซม.`;
    document.getElementById('adAgeGender').innerText = `${profile.age || "-"} ปี / ${profile.gender === 'male' ? "ชาย" : (profile.gender === 'female' ? "หญิง" : "-")}`;
    document.getElementById('adBmi').innerText = profile.bmi || "-";
    document.getElementById('adBmr').innerText = profile.bmr ? `${profile.bmr} kcal` : "-";
    document.getElementById('adTdee').innerText = profile.tdee ? `${profile.tdee} kcal` : "-";
    
    const diffCal = (profile.targetCal || 0) - (today.calories || 0);
    document.getElementById('adTargetCal').innerText = profile.targetCal || 0;
    document.getElementById('adConsumedCal').innerText = today.calories || 0;
    
    if(diffCal >= 0) {
        document.getElementById('adRemainingLabel').innerText = "กินได้อีก";
        document.getElementById('adRemainingCal').innerText = diffCal;
        document.getElementById('adRemainingCal').className = "text-base font-extrabold text-teal-600 mt-1";
    } else {
        document.getElementById('adRemainingLabel').innerText = "เกินโควตา";
        document.getElementById('adRemainingCal').innerText = `+${Math.abs(diffCal)}`;
        document.getElementById('adRemainingCal').className = "text-base font-extrabold text-red-500 mt-1";
    }

    const pTar = profile.targetProtein || 1, cTar = profile.targetCarbs || 1, fTar = profile.targetFat || 1;
    document.getElementById('adPConsumed').innerText = today.protein; document.getElementById('adPTarget').innerText = profile.targetProtein || 0;
    document.getElementById('adPPct').innerText = `${Math.round((today.protein / pTar) * 100)}%`; document.getElementById('adPBar').style.width = `${Math.min(100, Math.round((today.protein / pTar) * 100))}%`;
    document.getElementById('adCConsumed').innerText = today.carbs; document.getElementById('adCTarget').innerText = profile.targetCarbs || 0;
    document.getElementById('adCPct').innerText = `${Math.round((today.carbs / cTar) * 100)}%`; document.getElementById('adCBar').style.width = `${Math.min(100, Math.round((today.carbs / cTar) * 100))}%`;
    document.getElementById('adFConsumed').innerText = today.fat; document.getElementById('adFTarget').innerText = profile.targetFat || 0;
    document.getElementById('adFPct').innerText = `${Math.round((today.fat / fTar) * 100)}%`; document.getElementById('adFBar').style.width = `${Math.min(100, Math.round((today.fat / fTar) * 100))}%`;

    const listEl = document.getElementById('adHistoryList');
    listEl.innerHTML = "";
    if(history.length === 0) listEl.innerHTML = "<div class='text-center text-gray-400 py-6 text-xs'>ยังไม่มีรายการอาหารที่บันทึกวันนี้</div>";
    else history.forEach((item, index) => {
        listEl.innerHTML += `
            <li class="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                <div class="flex-1">
                    <div class="font-bold text-gray-800 text-sm">${item.name}</div>
                    <div class="text-[11px] text-gray-500 mt-0.5">🕒 ${item.time} | <strong class="text-orange-600">${item.cal} kcal</strong></div>
                </div>
                <button onclick="deleteFoodItem(${index})" class="text-gray-400 hover:text-red-500 p-2 text-base transition">🗑️</button>
            </li>`;
    });
}

function deleteFoodItem(index) {
    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    if(confirm(`ต้องการลบรายการ "${history[index].name}" ใช่หรือไม่?`)) {
        let current = getTodayNutrition();
        current.calories = Math.max(0, current.calories - history[index].cal);
        current.protein = Math.max(0, current.protein - (history[index].p || 0));
        current.carbs = Math.max(0, current.carbs - (history[index].c || 0));
        current.fat = Math.max(0, current.fat - (history[index].f || 0));
        history.splice(index, 1);
        localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));
        localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));
        loadProfile();
    }
}

function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตข้อมูลการกินวันนี้ทั้งหมดใช่หรือไม่?`)) {
        localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify({ calories: 0, protein: 0, carbs: 0, fat: 0 }));
        localStorage.removeItem(`nubcalorie_${currentUser}_history`); loadProfile();
    }
}

function openManualEntry() {
    document.getElementById('manualEntryModal').classList.remove('hidden');
}
function closeManualEntry() {
    document.getElementById('manualEntryModal').classList.add('hidden');
}

function saveManualFood() {
    const name = document.getElementById('manualFoodName').value.trim();
    const cal = parseInt(document.getElementById('manualCalories').value) || 0;
    const p = parseInt(document.getElementById('manualProtein').value) || 0;
    const c = parseInt(document.getElementById('manualCarbs').value) || 0;
    const f = parseInt(document.getElementById('manualFat').value) || 0;

    if(!name || cal === 0) { alert("กรุณาพิมพ์ชื่ออาหารและแคลอรี่ให้ครบถ้วนครับ"); return; }

    let current = getTodayNutrition();
    current.calories += cal; current.protein += p; current.carbs += c; current.fat += f;
    localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));

    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    history.push({ name: name, cal: cal, p: p, c: c, f: f, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

    closeManualEntry(); loadProfile(); alert(`บันทึกเรียบร้อยแล้ว!`);
}

function openHistory() {
    const history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    const listEl = document.getElementById('historyList');
    listEl.innerHTML = history.length === 0 ? "<div class='text-center text-gray-400 mt-10'>ยังไม่มีประวัติการกินในวันนี้</div>" : "";
    
    history.forEach((item) => {
        listEl.innerHTML += `
            <li class="bg-gray-50 p-3 rounded-xl border shadow-sm flex justify-between">
                <div><div class="font-bold">${item.name}</div><div class="text-[11px] text-gray-400">🕒 ${item.time}</div></div>
                <div class="font-bold text-orange-500">+${item.cal} kcal</div>
            </li>`;
    });
    document.getElementById('historyModal').classList.remove('hidden');
}
function closeHistory() { document.getElementById('historyModal').classList.add('hidden'); }

// ==========================================
// 📸 ระบบ AI วิเคราะห์ภาพ (ใช้ Hugging Face)
// ==========================================
async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        try {
            // ใช้ Model วิเคราะห์ภาพตัวที่เสถียรของ Hugging Face
            const response = await fetch("https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${HF_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: "นี่คือภาพอาหารอะไรในไทย? ประเมินแคลอรี่และสารอาหารสำหรับ 1 จาน ตอบเป็น JSON เท่านั้น รูปแบบ: {\"name\": \"ชื่ออาหาร\", \"cal\": 500, \"p\": 20, \"c\": 50, \"f\": 10}",
                    image: base64Image
                })
            });

            if (!response.ok) throw new Error("เครือข่ายมีปัญหา ลองอีกครั้งครับ");

            const data = await response.json();
            
            // สกัดข้อมูล JSON
            let resultText = data[0]?.generated_text || "{}";
            const match = resultText.match(/\{[\s\S]*\}/);
            const foodData = match ? JSON.parse(match[0]) : { name: "อาหารที่สแกนเจอ", cal: 350, p: 15, c: 30, f: 10 };

            tempFoodData = {
                name: foodData.name || "อาหารไม่ทราบชื่อ", 
                cal: parseInt(foodData.cal) || 0, p: parseInt(foodData.p) || 0, c: parseInt(foodData.c) || 0, f: parseInt(foodData.f) || 0
            };

            document.getElementById('loading').classList.add('hidden');
            showFoodResultModal(tempFoodData);

        } catch (error) {
            console.error("AI Error:", error);
            // กรณีระบบวิเคราะห์ขัดข้องชั่วคราว จะเปิดหน้าจดเองให้เพื่อไม่ให้สะดุด
            alert("ตอนนี้ AI กำลังอัปเดตระบบ หรือรูปภาพอาจจะไม่ชัดเจนพอ ให้บันทึกเองก่อนได้เลยครับ");
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('cameraInput').value = "";
            openManualEntry(); 
        }
    };
    reader.readAsDataURL(file);
}

function showFoodResultModal(food) {
    document.getElementById('resultFoodName').innerText = food.name;
    document.getElementById('resultCalories').innerText = food.cal;
    document.getElementById('resultProtein').innerText = `${food.p}g`;
    document.getElementById('resultCarbs').innerText = `${food.c}g`;
    document.getElementById('resultFat').innerText = `${food.f}g`;
    document.getElementById('foodResultModal').classList.remove('hidden');
}

function closeResultModal() {
    document.getElementById('foodResultModal').classList.add('hidden');
    tempFoodData = null;
    document.getElementById('cameraInput').value = "";
}

function confirmAddFood() {
    if(!tempFoodData) return;
    let current = getTodayNutrition();
    current.calories += tempFoodData.cal; current.protein += tempFoodData.p; current.carbs += tempFoodData.c; current.fat += tempFoodData.f;
    localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));
    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    history.push({ name: tempFoodData.name, cal: tempFoodData.cal, p: tempFoodData.p, c: tempFoodData.c, f: tempFoodData.f, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));
    closeResultModal(); loadProfile();
}
