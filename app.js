let currentUser = ""; 
let userList = []; 
let tempFoodData = null; 
let activeTab = 'home'; 

// 🚀 รหัส API KEY ของคุณ
const GEMINI_API_KEY = "AQ.Ab8RN6KZT3TUOvBNpWPg_QWZf9rh_GbUauxvjTUpQoqW7Iaypg";

// ==========================================
// 💡 ฐานข้อมูลอาหารสำหรับระบบแนะนำ (Mock Database)
// ==========================================
let currentFoodPref = 'clean'; // ค่าเริ่มต้นเป็นคลีน
const foodDB = {
    clean: [
        { name: "สลัดอกไก่ย่างน้ำใส", cal: 200 },
        { name: "ยำวุ้นเส้นหมูสับ (ไม่มัน)", cal: 250 },
        { name: "สุกี้น้ำไก่ (เน้นผัก)", cal: 280 },
        { name: "ไข่ต้ม 2 ฟอง + แซนด์วิชโฮลวีต", cal: 300 },
        { name: "ปลาซาบะย่างซีอิ๊ว + ผักต้ม", cal: 320 },
        { name: "อกไก่ย่าง + ข้าวกล้อง 1 ทัพพี", cal: 350 },
        { name: "สเต็กปลาแซลมอน", cal: 400 },
        { name: "โยเกิร์ตไขมันต่ำ + ผลไม้รวม", cal: 150 },
        { name: "ข้าวโอ๊ตต้มใส่นมแอลมอนด์", cal: 220 },
        { name: "แกงจืดเต้าหู้หมูสับ (ไม่ซดน้ำ)", cal: 150 },
        { name: "น้ำเต้าหู้หวานน้อย + ธัญพืช", cal: 120 }
    ],
    general: [
        { name: "ราดหน้าเส้นใหญ่หมู", cal: 400 },
        { name: "ก๋วยเตี๋ยวเส้นเล็กต้มยำ", cal: 450 },
        { name: "ยำมาม่าใส่หมูยอ", cal: 480 },
        { name: "ส้มตำไทย + ไก่ย่าง", cal: 500 },
        { name: "ข้าวผัดหมูใส่ไข่", cal: 550 },
        { name: "ข้าวกะเพราหมูสับไข่ดาว", cal: 600 },
        { name: "ข้าวซอยไก่", cal: 600 },
        { name: "ข้าวมันไก่ (ไม่หนัง)", cal: 650 },
        { name: "ข้าวหมูแดงหมูกรอบ", cal: 750 },
        { name: "ผัดไทยกุ้งสด", cal: 700 },
        { name: "ชาบู/หมูกระทะ (ชุดเล็ก)", cal: 800 }
    ]
};

window.onload = () => {
    const savedUsers = localStorage.getItem('nubcalorie_userList') || localStorage.getItem('fitbite_userList');
    if(savedUsers) userList = JSON.parse(savedUsers);
    if(userList.length === 0) {
        userList.push("ฉัน");
        localStorage.setItem('nubcalorie_userList', JSON.stringify(userList));
    }
    const lastUser = localStorage.getItem('nubcalorie_currentUser') || localStorage.getItem('fitbite_currentUser');
    currentUser = (lastUser && userList.includes(lastUser)) ? lastUser : userList[0];
    updateUserDropdown();
    loadProfile();
};

function switchTab(tab) {
    activeTab = tab;
    const homeView = document.getElementById('homeView');
    const allDataView = document.getElementById('allDataView');
    const tabHome = document.getElementById('tabHome');
    const tabAllData = document.getElementById('tabAllData');

    if(tab === 'home') {
        homeView.classList.remove('hidden');
        allDataView.classList.add('hidden');
        tabHome.className = "py-2.5 flex-1 text-center border-b-4 border-yellow-300 text-yellow-300 transition";
        tabAllData.className = "py-2.5 flex-1 text-center border-b-4 border-transparent text-teal-100 hover:text-white transition";
    } else {
        homeView.classList.add('hidden');
        allDataView.classList.remove('hidden');
        tabHome.className = "py-2.5 flex-1 text-center border-b-4 border-transparent text-teal-100 hover:text-white transition";
        tabAllData.className = "py-2.5 flex-1 text-center border-b-4 border-yellow-300 text-yellow-300 transition";
        renderAllDataView(); 
    }
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

    if(!weight || !height || !age) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return;
    }

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);
    let bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + ((gender === 'male') ? 5 : -161));
    const tdee = Math.round(bmr * activity);

    let targetCal = tdee;
    if (goal === 'lose') targetCal = Math.max(1200, tdee - 500);
    else if (goal === 'gain') targetCal = tdee + 400;

    const targetProtein = Math.round((targetCal * 0.25) / 4);
    const targetCarbs = Math.round((targetCal * 0.50) / 4);
    const targetFat = Math.round((targetCal * 0.25) / 9);

    const profileData = { weight, height, age, gender, activity, goal, bmi, bmr, tdee, targetCal, targetProtein, targetCarbs, targetFat };
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
        document.getElementById('weight').value = "";
        document.getElementById('height').value = "";
        document.getElementById('age').value = "";
        document.getElementById('goal').value = "maintain";
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

    // อัปเดตระบบแนะนำอาหารทุกครั้งที่มีการเปลี่ยนแคลอรี
    generateSuggestions(profile.targetCal || 0, current.calories || 0);
}

// ==========================================
// 💡 ระบบแนะนำเมนูอาหาร (Food Recommender)
// ==========================================
function setFoodPreference(type) {
    currentFoodPref = type;
    
    // เปลี่ยนสีปุ่มให้รู้ว่ากำลังเลือกอันไหนอยู่
    if (type === 'clean') {
        document.getElementById('btnCleanFood').className = "flex-1 py-2 text-[11px] font-bold rounded-md bg-white shadow text-green-600 transition";
        document.getElementById('btnGeneralFood').className = "flex-1 py-2 text-[11px] font-bold rounded-md text-gray-500 hover:text-orange-500 transition";
    } else {
        document.getElementById('btnCleanFood').className = "flex-1 py-2 text-[11px] font-bold rounded-md text-gray-500 hover:text-green-600 transition";
        document.getElementById('btnGeneralFood').className = "flex-1 py-2 text-[11px] font-bold rounded-md bg-white shadow text-orange-500 transition";
    }
    
    // ดึงค่าแคลอรีมาคำนวณใหม่
    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || { targetCal: 0 };
    const current = getTodayNutrition();
    generateSuggestions(profile.targetCal, current.calories);
}

function generateSuggestions(targetCal = 0, consumedCal = 0) {
    let remaining = targetCal - consumedCal;
    document.getElementById('suggestRemaining').innerText = remaining;
    
    const listEl = document.getElementById('suggestionList');
    listEl.innerHTML = "";

    // ถ้าแคลอรีหมดแล้ว หรือเหลือน้อยมาก
    if(remaining <= 50) {
        listEl.innerHTML = `<div class="text-center text-xs text-red-500 py-3 font-bold bg-red-50 rounded-lg">🚫 โควตาวันนี้หมดแล้ว!<br>แนะนำดื่มน้ำเปล่า หรือชา/กาแฟดำ (ไม่หวาน)</div>`;
        return;
    }

    // กรองเอาเฉพาะอาหารที่แคลอรี่ไม่เกินกว่าที่เหลืออยู่
    let availableFoods = foodDB[currentFoodPref].filter(f => f.cal <= remaining);

    if(availableFoods.length === 0) {
        listEl.innerHTML = `<div class="text-center text-xs text-orange-500 py-3 font-bold bg-orange-50 rounded-lg">⚠️ แคลอรีเหลือน้อยเกินไป<br>แนะนำทานผลไม้สด หรือของว่างเบาๆ (ต่ำกว่า 100 kcal)</div>`;
        return;
    }

    // สุ่มเรียงลำดับอาร์เรย์ใหม่ และเลือกมาแค่ 3 อย่าง
    availableFoods = availableFoods.sort(() => 0.5 - Math.random());
    const picked = availableFoods.slice(0, 3);

    // สร้างกล่องแสดงผลเมนู
    picked.forEach(item => {
        listEl.innerHTML += `
            <li class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <span class="text-xs font-bold text-gray-700">🍽️ ${item.name}</span>
                <span class="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">${item.cal} kcal</span>
            </li>
        `;
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
    
    const goalMap = { 'lose': 'ลดน้ำหนัก', 'maintain': 'รักษาน้ำหนัก', 'gain': 'เพิ่มกล้ามเนื้อ' };
    document.getElementById('adGoal').innerText = goalMap[profile.goal] || "-";

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
    document.getElementById('adPConsumed').innerText = today.protein;
    document.getElementById('adPTarget').innerText = profile.targetProtein || 0;
    document.getElementById('adPPct').innerText = `${Math.round((today.protein / pTar) * 100)}%`;
    document.getElementById('adPBar').style.width = `${Math.min(100, Math.round((today.protein / pTar) * 100))}%`;

    document.getElementById('adCConsumed').innerText = today.carbs;
    document.getElementById('adCTarget').innerText = profile.targetCarbs || 0;
    document.getElementById('adCPct').innerText = `${Math.round((today.carbs / cTar) * 100)}%`;
    document.getElementById('adCBar').style.width = `${Math.min(100, Math.round((today.carbs / cTar) * 100))}%`;

    document.getElementById('adFConsumed').innerText = today.fat;
    document.getElementById('adFTarget').innerText = profile.targetFat || 0;
    document.getElementById('adFPct').innerText = `${Math.round((today.fat / fTar) * 100)}%`;
    document.getElementById('adFBar').style.width = `${Math.min(100, Math.round((today.fat / fTar) * 100))}%`;

    const listEl = document.getElementById('adHistoryList');
    listEl.innerHTML = "";
    if(history.length === 0) {
        listEl.innerHTML = "<div class='text-center text-gray-400 py-6 text-xs'>ยังไม่มีรายการอาหารที่บันทึกวันนี้</div>";
    } else {
        history.forEach((item, index) => {
            listEl.innerHTML += `
                <li class="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                    <div class="flex-1">
                        <div class="font-bold text-gray-800 text-sm">${item.name}</div>
                        <div class="text-[11px] text-gray-500 mt-0.5">🕒 ${item.time} | <strong class="text-orange-600">${item.cal} kcal</strong></div>
                        <div class="flex gap-2 mt-1 text-[10px] text-gray-600">
                            <span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">P: ${item.p || 0}g</span>
                            <span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">C: ${item.c || 0}g</span>
                            <span class="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">F: ${item.f || 0}g</span>
                        </div>
                    </div>
                    <button onclick="deleteFoodItem(${index})" class="text-gray-400 hover:text-red-500 p-2 text-base transition">🗑️</button>
                </li>`;
        });
    }
}

function deleteFoodItem(index) {
    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    if(index >= 0 && index < history.length) {
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
}

function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตข้อมูลการกินวันนี้ทั้งหมดใช่หรือไม่?`)) {
        localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify({ calories: 0, protein: 0, carbs: 0, fat: 0 }));
        localStorage.removeItem(`nubcalorie_${currentUser}_history`); 
        loadProfile();
    }
}

function openManualEntry() {
    document.getElementById('manualFoodName').value = "";
    document.getElementById('manualCalories').value = "";
    document.getElementById('manualProtein').value = "";
    document.getElementById('manualCarbs').value = "";
    document.getElementById('manualFat').value = "";
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

    if(!name || cal === 0) {
        alert("กรุณาพิมพ์ชื่ออาหารและตัวเลขแคลอรี่รวมให้ครบถ้วนครับ"); return;
    }

    let current = getTodayNutrition();
    current.calories += cal; current.protein += p; current.carbs += c; current.fat += f;
    localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));

    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    history.push({ name: name, cal: cal, p: p, c: c, f: f, time: timeNow });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

    closeManualEntry();
    loadProfile();
    alert(`บันทึก "${name}" เรียบร้อยแล้ว!`);
}

// ==========================================
// 📸 ระบบ AI วิเคราะห์ภาพ
// ==========================================
async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64Image = compressedDataUrl.split(',')[1];
            
            sendToGemini(base64Image); 
        }
        
        img.onerror = function() {
            alert("รูปภาพนามสกุลนี้ไม่รองรับ กรุณาใช้ไฟล์ JPG หรือ PNG นะครับ");
            document.getElementById('loading').classList.add('hidden');
        };
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

async function sendToGemini(base64Image) {
    try {
        const cleanApiKey = GEMINI_API_KEY.trim(); 

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": cleanApiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "วิเคราะห์ภาพนี้ว่าเป็นอาหารอะไร ประเมินแคลอรี่และสารอาหารสำหรับ 1 จาน ห้ามมีคำอธิบาย ห้ามมี markdown ให้ตอบกลับเป็น JSON format เท่านั้น ตัวอย่าง: {\"name\": \"ข้าวผัดหมู\", \"cal\": 550, \"p\": 20, \"c\": 50, \"f\": 15}" },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`API Error: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;
        resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const foodData = JSON.parse(resultText);

        tempFoodData = {
            name: foodData.name || "อาหารไม่ทราบชื่อ", 
            cal: parseInt(foodData.cal) || 0, 
            p: parseInt(foodData.p) || 0, 
            c: parseInt(foodData.c) || 0, 
            f: parseInt(foodData.f) || 0
        };

        document.getElementById('loading').classList.add('hidden');
        showFoodResultModal(tempFoodData);

    } catch (error) {
        console.error("Gemini Error:", error);
        alert("ขออภัยครับ ถ่ายภาพใหม่อีกครั้ง หรือลองถ่ายมุมที่เห็นอาหารชัดเจนขึ้นนะครับ\n(ข้อผิดพลาด: " + error.message + ")");
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('cameraInput').value = "";
    }
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
    current.calories += tempFoodData.cal;
    current.protein += tempFoodData.p;
    current.carbs += tempFoodData.c;
    current.fat += tempFoodData.f;

    localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));

    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    history.push({
        name: tempFoodData.name, cal: tempFoodData.cal, p: tempFoodData.p, c: tempFoodData.c, f: tempFoodData.f, time: timeNow
    });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

    closeResultModal();
    loadProfile();
}

function openHistory() {
    const history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    const listEl = document.getElementById('historyList');
    listEl.innerHTML = "";
    if(history.length === 0) {
        listEl.innerHTML = "<div class='text-center text-gray-400 mt-10'>ยังไม่มีประวัติการกินในวันนี้</div>";
    } else {
        history.forEach((item) => {
            listEl.innerHTML += `
                <li class="bg-gray-50 p-3 rounded-xl border shadow-sm">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-bold text-gray-800">${item.name}</div>
                            <div class="text-[11px] text-gray-400 mt-0.5">🕒 เวลา: ${item.time}</div>
                        </div>
                        <div class="font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full text-xs">
                            +${item.cal} kcal
                        </div>
                    </div>
                    <div class="flex gap-2 mt-2 pt-2 border-t text-[11px] text-gray-600">
                        <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">🍗 P: ${item.p || 0}g</span>
                        <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">🍚 C: ${item.c || 0}g</span>
                        <span class="bg-rose-50 text-rose-700 px-2 py-0.5 rounded">🥑 F: ${item.f || 0}g</span>
                    </div>
                </li>`;
        });
    }
    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}
