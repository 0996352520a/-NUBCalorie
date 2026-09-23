let currentUser = ""; 
let userList = []; 
let tempFoodData = null; // พักข้อมูลอาหารที่ AI วิเคราะห์ได้ก่อนกดยืนยัน

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

// คำนวณ BMI, TDEE, แคลอรีตามเป้าหมาย และสัดส่วนสารอาหาร (Macros)
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

    // 1. BMI
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    // 2. BMR (สูตร Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male') ? 5 : -161;

    // 3. TDEE
    const tdee = Math.round(bmr * activity);

    // 4. แคลอรีตามเป้าหมาย (Target Calories)
    let targetCal = tdee;
    if (goal === 'lose') {
        targetCal = Math.max(1200, tdee - 500); // ไม่ให้ต่ำกว่า 1200 kcal เพื่อความปลอดภัย
    } else if (goal === 'gain') {
        targetCal = tdee + 400; // เพิ่มกล้ามเนื้อแบบ Lean bulk
    }

    // 5. สัดส่วนสารอาหารเป้าหมาย (Macros Target ในหน่วยกรัม)
    // โปรตีน 25-30% (4 kcal/g), คาร์บ 45-50% (4 kcal/g), ไขมัน 25% (9 kcal/g)
    const targetProtein = Math.round((targetCal * 0.25) / 4);
    const targetCarbs = Math.round((targetCal * 0.50) / 4);
    const targetFat = Math.round((targetCal * 0.25) / 9);

    const profileData = {
        weight, height, age, gender, activity, goal,
        bmi, tdee, targetCal,
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
    
    // โหลดสารอาหารที่กินไปแล้วในวันนี้
    const currentNutrition = getTodayNutrition();
    updateNutritionUI(currentNutrition);

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
            bmi: 0, tdee: 0, targetCal: 0,
            targetProtein: 0, targetCarbs: 0, targetFat: 0,
            goal: 'maintain'
        });
    }
}

function updateDashboard(p) {
    document.getElementById('bmiDisplay').innerText = p.bmi;
    document.getElementById('tdeeDisplay').innerText = p.tdee;
    document.getElementById('targetCalDisplay').innerText = p.targetCal;

    // ข้อความเป้าหมาย
    const goalText = {
        'lose': '🔻 ลดน้ำหนัก (-500)',
        'maintain': '⚖️ รักษาน้ำหนัก',
        'gain': '🔺 เพิ่มน้ำหนัก (+400)'
    };
    document.getElementById('goalDisplay').innerText = goalText[p.goal] || 'รักษาน้ำหนัก';

    // แปลผล BMI
    let statusText = "";
    if (p.bmi > 0) {
        if (p.bmi < 18.5) statusText = "น้ำหนักน้อยกว่าเกณฑ์";
        else if (p.bmi < 23) statusText = "สมส่วนสุขภาพดี";
        else if (p.bmi < 25) statusText = "ท้วม / น้ำหนักเกิน";
        else statusText = "อ้วน / เสี่ยงสุขภาพ";
    }
    document.getElementById('bmiStatus').innerText = statusText;

    // เป้าหมายสารอาหาร
    document.getElementById('targetProtein').innerText = p.targetProtein || 0;
    document.getElementById('targetCarbs').innerText = p.targetCarbs || 0;
    document.getElementById('targetFat').innerText = p.targetFat || 0;

    // อัปเดต Progress Bar
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

    // คำนวณเปอร์เซ็นต์แถบ Progress bar
    const pPct = Math.min(100, Math.round((current.protein / (profile.targetProtein || 1)) * 100));
    const cPct = Math.min(100, Math.round((current.carbs / (profile.targetCarbs || 1)) * 100));
    const fPct = Math.min(100, Math.round((current.fat / (profile.targetFat || 1)) * 100));

    document.getElementById('barProtein').style.width = `${pPct}%`;
    document.getElementById('barCarbs').style.width = `${cPct}%`;
    document.getElementById('barFat').style.width = `${fPct}%`;
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

// ระบบถ่ายภาพและจำลอง AI แยกสารอาหาร 3 หมู่
async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    // รายการอาหารตัวอย่างที่มีสารอาหารสมจริง
    const sampleFoods = [
        { name: "ข้าวกะเพราอกไก่ + ไข่ดาว", cal: 520, p: 32, c: 60, f: 16 },
        { name: "สลัดอกไก่ย่างน้ำใส", cal: 320, p: 35, c: 15, f: 12 },
        { name: "ก๋วยเตี๋ยวเส้นเล็กต้มยำหมู", cal: 410, p: 20, c: 55, f: 12 },
        { name: "แซลมอนย่างซีอิ๊ว + ข้าวญี่ปุ่น", cal: 580, p: 38, c: 45, f: 24 },
        { name: "ไข่ต้ม 2 ฟอง + ขนมปังโฮลวีต", cal: 260, p: 16, c: 24, f: 10 }
    ];

    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
        // สุ่มตัวอย่างอาหารมาแสดงผล
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
    document.getElementById('cameraInput').value = ""; // เคลียร์กล้อง
}

function confirmAddFood() {
    if(!tempFoodData) return;

    // 1. รวมสารอาหารประจำวัน
    let current = getTodayNutrition();
    current.calories += tempFoodData.cal;
    current.protein += tempFoodData.p;
    current.carbs += tempFoodData.c;
    current.fat += tempFoodData.f;

    localStorage.setItem(`nubcalorie_${currentUser}_todayNutrition`, JSON.stringify(current));

    // 2. บันทึกลงประวัติ
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

// ประวัติการกิน แสดงสารอาหารละเอียด
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
                    <!-- แถบสารอาหารย่อย -->
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
