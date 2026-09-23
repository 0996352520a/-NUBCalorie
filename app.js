let currentUser = ""; 
let userList = []; 
let tempFoodData = null; 
let activeTab = 'home'; // แท็บปัจจุบัน ('home' หรือ 'allData')

window.onload = () => {
    const savedUsers = localStorage.getItem('nubcalorie_userList') || localStorage.getItem('fitbite_userList');
    if(savedUsers) {
        userList = JSON.parse(savedUsers);
    }

    if(userList.length === 0) {
        userList.push("ฉัน");
        localStorage.setItem('nubcalorie_userList', JSON.stringify(userList));
    }

    const lastUser = localStorage.getItem('nubcalorie_currentUser') || localStorage.getItem('fitbite_currentUser');
    if(lastUser && userList.includes(lastUser)) {
        currentUser = lastUser;
    } else {
        currentUser = userList[0];
    }

    updateUserDropdown();
    loadProfile();
};

// สลับหน้าระหว่าง "หน้าหลัก" และ "ข้อมูลทั้งหมด"
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
        renderAllDataView(); // อัปเดตข้อมูลหน้ารายงานทั้งหมด
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
    const newName = prompt("กรุณาพิมพ์ชื่อผู้ใช้ใหม่ (เช่น พ่อ, แม่, แฟน):");
    
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
    const selector = document.getElementById('userSelector');
    currentUser = selector.value;
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
        alert("กรุณากรอกข้อมูล น้ำหนัก ส่วนสูง และอายุ ให้ครบถ้วน");
        return;
    }

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    let bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + ((gender === 'male') ? 5 : -161));
    const tdee = Math.round(bmr * activity);

    let targetCal = tdee;
    if (goal === 'lose') {
        targetCal = Math.max(1200, tdee - 500);
    } else if (goal === 'gain') {
        targetCal = tdee + 400;
    }

    const targetProtein = Math.round((targetCal * 0.25) / 4);
    const targetCarbs = Math.round((targetCal * 0.50) / 4);
    const targetFat = Math.round((targetCal * 0.25) / 9);

    const profileData = {
        weight, height, age, gender, activity, goal,
        bmi, bmr, tdee, targetCal,
        targetProtein, targetCarbs, targetFat
    };

    localStorage.setItem(`nubcalorie_${currentUser}_profile`, JSON.stringify(profileData));
    updateDashboard(profileData);
    alert(`บันทึกแผนโภชนาการของ ${currentUser} สำเร็จ!`);
}

function loadProfile() {
    document.getElementById('profileNameDisplay').innerText = currentUser;
    document.getElementById('historyName').innerText = currentUser;

    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`));
    const currentNutrition = getTodayNutrition();
    updateNutritionUI(currentNutrition, profile);

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
        updateDashboard({
            bmi: 0, bmr: 0, tdee: 0, targetCal: 0,
            targetProtein: 0, targetCarbs: 0, targetFat: 0,
            goal: 'maintain'
        });
    }

    if(activeTab === 'allData') {
        renderAllDataView();
    }
}

function updateDashboard(p) {
    document.getElementById('bmiDisplay').innerText = p.bmi;
    document.getElementById('tdeeDisplay').innerText = p.tdee;
    document.getElementById('targetCalDisplay').innerText = p.targetCal;

    const goalText = {
        'lose': '🔻 ลดน้ำหนัก (-500)',
        'maintain': '⚖️ รักษาน้ำหนัก',
        'gain': '🔺 เพิ่มน้ำหนัก (+400)'
    };
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

    const current = getTodayNutrition();
    updateNutritionUI(current, p);
}

function getTodayNutrition() {
    return JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_todayNutrition`)) || {
        calories: 0, protein: 0, carbs: 0, fat: 0
    };
}

function updateNutritionUI(current, profile = null) {
    if(!profile) {
        profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || {
            targetProtein: 1, targetCarbs: 1, targetFat: 1
        };
    }

    document.getElementById('calDisplay').innerText = current.calories;
    document.getElementById('consumedProtein').innerText = current.protein;
    document.getElementById('consumedCarbs').innerText = current.carbs;
    document.getElementById('consumedFat').innerText = current.fat;

    const pPct = Math.min(100, Math.round((current.protein / (profile.targetProtein || 1)) * 100));
    const cPct = Math.min(100, Math.round((current.carbs / (profile.targetCarbs || 1)) * 100));
    const fPct = Math.min(100, Math.round((current.fat / (profile.targetFat || 1)) * 100));

    document.getElementById('barProtein').style.width = `${pPct}%`;
    document.getElementById('barCarbs').style.width = `${cPct}%`;
    document.getElementById('barFat').style.width = `${fPct}%`;
}

// ==================== เรนเดอร์หน้า "ข้อมูลทั้งหมด" (All Data View) ====================
function renderAllDataView() {
    document.getElementById('allDataUserName').innerText = currentUser;
    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`)) || {};
    const today = getTodayNutrition();
    const history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");

    // 1. ค่าทางกายภาพ
    const w = profile.weight ? `${profile.weight} กก.` : "-";
    const h = profile.height ? `${profile.height} ซม.` : "-";
    document.getElementById('adWeightHeight').innerText = `${w} / ${h}`;

    const age = profile.age ? `${profile.age} ปี` : "-";
    const gender = profile.gender === 'male' ? "ชาย" : (profile.gender === 'female' ? "หญิง" : "-");
    document.getElementById('adAgeGender').innerText = `${age} / ${gender}`;

    document.getElementById('adBmi').innerText = profile.bmi || "-";
    let bmiDesc = "-";
    if(profile.bmi > 0) {
        if(profile.bmi < 18.5) bmiDesc = "ต่ำกว่าเกณฑ์";
        else if(profile.bmi < 23) bmiDesc = "สมส่วน";
        else if(profile.bmi < 25) bmiDesc = "น้ำหนักเกิน";
        else bmiDesc = "ภาวะอ้วน";
    }
    document.getElementById('adBmiStatus').innerText = bmiDesc;
    document.getElementById('adBmr').innerText = profile.bmr ? `${profile.bmr} kcal` : "-";
    document.getElementById('adTdee').innerText = profile.tdee ? `${profile.tdee} kcal` : "-";

    const goalMap = { 'lose': 'ลดน้ำหนัก', 'maintain': 'รักษาน้ำหนัก', 'gain': 'เพิ่มกล้ามเนื้อ' };
    document.getElementById('adGoal').innerText = goalMap[profile.goal] || "-";

    // 2. แคลอรี & คงเหลือ
    const targetCal = profile.targetCal || 0;
    const consumedCal = today.calories || 0;
    const diffCal = targetCal - consumedCal;

    document.getElementById('adTargetCal').innerText = targetCal;
    document.getElementById('adConsumedCal').innerText = consumedCal;
    
    if(diffCal >= 0) {
        document.getElementById('adRemainingLabel').innerText = "กินได้อีก";
        document.getElementById('adRemainingCal').innerText = diffCal;
        document.getElementById('adRemainingCal').className = "text-base font-extrabold text-teal-600 mt-1";
    } else {
        document.getElementById('adRemainingLabel').innerText = "เกินโควตา";
        document.getElementById('adRemainingCal').innerText = `+${Math.abs(diffCal)}`;
        document.getElementById('adRemainingCal').className = "text-base font-extrabold text-red-500 mt-1";
    }

    // 3. สารอาหาร 3 หมู่
    const pTar = profile.targetProtein || 1;
    const cTar = profile.targetCarbs || 1;
    const fTar = profile.targetFat || 1;

    const pPct = Math.round((today.protein / pTar) * 100);
    const cPct = Math.round((today.carbs / cTar) * 100);
    const fPct = Math.round((today.fat / fTar) * 100);

    document.getElementById('adPConsumed').innerText = today.protein;
    document.getElementById('adPTarget').innerText = profile.targetProtein || 0;
    document.getElementById('adPPct').innerText = `${pPct}%`;
    document.getElementById('adPBar').style.width = `${Math.min(100, pPct)}%`;

    document.getElementById('adCConsumed').innerText = today.carbs;
    document.getElementById('adCTarget').innerText = profile.targetCarbs || 0;
    document.getElementById('adCPct').innerText = `${cPct}%`;
    document.getElementById('adCBar').style.width = `${Math.min(100, cPct)}%`;

    document.getElementById('adFConsumed').innerText = today.fat;
    document.getElementById('adFTarget').innerText = profile.targetFat || 0;
    document.getElementById('adFPct').innerText = `${fPct}%`;
    document.getElementById('adFBar').style.width = `${Math.min(100, fPct)}%`;

    // 4. แสดงประวัติอาหารแบบมีปุ่มลบ (Delete Item)
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
                        <div class="text-[11px] text-gray-500 mt-0.5">
                            🕒 ${item.time} | <strong class="text-orange-600">${item.cal} kcal</strong>
                        </div>
                        <div class="flex gap-2 mt-1 text-[10px] text-gray-600">
                            <span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">P: ${item.p || 0}g</span>
                            <span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">C: ${item.c || 0}g</span>
                            <span class="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">F: ${item.f || 0}g</span>
                        </div>
                    </div>
                    <button onclick="deleteFoodItem(${index})" class="text-gray-400 hover:text-red-500 p-2 text-base transition" title="ลบรายการนี้">
                        🗑️
                    </button>
                </li>
            `;
        });
    }
}

// ลบรายการอาหารทีละอัน
function deleteFoodItem(index) {
    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    if(index >= 0 && index < history.length) {
        const item = history[index];
        if(confirm(`ต้องการลบรายการ "${item.name}" ใช่หรือไม่?`)) {
            let current = getTodayNutrition();
            current.calories = Math.max(0, current.calories - item.cal);
            current.protein = Math.max(0, current.protein - (item.p || 0));
            current.carbs = Math.max(0, current.carbs - (item.c || 0));
            current.fat = Math.max(0, current.fat - (item.f || 0));

            history.splice(index, 1);

            localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));
            localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

            loadProfile();
        }
    }
}

function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตแคลอรีและสารอาหารทั้งหมดของ ${currentUser} ในวันนี้ใช่หรือไม่?`)) {
        localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify({
            calories: 0, protein: 0, carbs: 0, fat: 0
        }));
        localStorage.removeItem(`nubcalorie_${currentUser}_history`); 
        loadProfile();
    }
}

async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    const sampleFoods = [
        { name: "ข้าวกะเพราอกไก่ + ไข่ดาว", cal: 520, p: 32, c: 60, f: 16 },
        { name: "สลัดอกไก่ย่างน้ำใส", cal: 320, p: 35, c: 15, f: 12 },
        { name: "ก๋วยเตี๋ยวเส้นเล็กต้มยำหมู", cal: 410, p: 20, c: 55, f: 12 },
        { name: "แซลมอนย่างซีอิ๊ว + ข้าวญี่ปุ่น", cal: 580, p: 38, c: 45, f: 24 },
        { name: "ไข่ต้ม 2 ฟอง + ขนมปังโฮลวีต", cal: 260, p: 16, c: 24, f: 10 }
    ];

    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
        const picked = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
        tempFoodData = picked;
        showFoodResultModal(picked);
    }, 1800);
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
        name: tempFoodData.name,
        cal: tempFoodData.cal,
        p: tempFoodData.p,
        c: tempFoodData.c,
        f: tempFoodData.f,
        time: timeNow
    });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

    closeResultModal();
    loadProfile();
    alert(`บันทึก ${tempFoodData.name} สำเร็จ!`);
}

// ประวัติการกิน Popup ของหน้าหลัก
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
                </li>
            `;
        });
    }

    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}
