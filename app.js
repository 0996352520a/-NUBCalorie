let currentUser = ""; 
let userList = []; 

window.onload = () => {
    const savedUsers = localStorage.getItem('fitbite_userList');
    if(savedUsers) {
        userList = JSON.parse(savedUsers);
    }

    if(userList.length === 0) {
        userList.push("ฉัน");
        localStorage.setItem('fitbite_userList', JSON.stringify(userList));
    }

    const lastUser = localStorage.getItem('fitbite_currentUser');
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
            localStorage.setItem('fitbite_userList', JSON.stringify(userList));
        }
        
        currentUser = name;
        localStorage.setItem('fitbite_currentUser', currentUser);
        
        updateUserDropdown();
        loadProfile();
    }
}

function switchUser() {
    const selector = document.getElementById('userSelector');
    currentUser = selector.value;
    localStorage.setItem('fitbite_currentUser', currentUser);
    loadProfile(); 
}

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

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male') ? 5 : -161;
    const tdee = Math.round(bmr * parseFloat(activity));

    localStorage.setItem(`fitbite_${currentUser}_profile`, JSON.stringify({weight, height, age, gender, activity, bmi, tdee}));
    
    updateDashboard(bmi, tdee);
    alert(`บันทึกข้อมูลของ ${currentUser} เรียบร้อย!`);
}

function loadProfile() {
    document.getElementById('profileNameDisplay').innerText = currentUser;
    document.getElementById('historyName').innerText = currentUser; // ชื่อในหน้าต่างประวัติ

    const profile = JSON.parse(localStorage.getItem(`fitbite_${currentUser}_profile`));
    const calories = localStorage.getItem(`fitbite_${currentUser}_calories`) || 0;
    document.getElementById('calDisplay').innerText = calories;

    if(profile) {
        document.getElementById('weight').value = profile.weight;
        document.getElementById('height').value = profile.height;
        document.getElementById('age').value = profile.age;
        document.getElementById('gender').value = profile.gender;
        document.getElementById('activity').value = profile.activity;
        updateDashboard(profile.bmi, profile.tdee);
    } else {
        document.getElementById('weight').value = "";
        document.getElementById('height').value = "";
        document.getElementById('age').value = "";
        updateDashboard(0, 0);
    }
}

function updateDashboard(bmi, tdee) {
    document.getElementById('bmiDisplay').innerText = bmi;
    document.getElementById('tdeeDisplay').innerText = tdee;
}

// ล้างข้อมูลแคลอรี และ ล้างประวัติการกินด้วย
function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตแคลอรีและประวัติการกินวันนี้ของ ${currentUser} ใช่หรือไม่?`)) {
        localStorage.setItem(`fitbite_${currentUser}_calories`, 0);
        localStorage.removeItem(`fitbite_${currentUser}_history`); 
        document.getElementById('calDisplay').innerText = 0;
    }
}

async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    // จำลองเวลาประมวลผล 2 วินาที แล้วใส่ชื่ออาหาร+แคลอรี
    setTimeout(() => {
        addCalories(450, "ข้าวกะเพราไก่ไข่ดาว (ระบบจำลอง)");
    }, 2000);
}

// อัปเดตฟังก์ชันนี้ให้บันทึกประวัติด้วย
function addCalories(cal, foodName) {
    document.getElementById('loading').classList.add('hidden');
    
    // 1. บวกแคลอรีรวม
    let currentCal = parseInt(localStorage.getItem(`fitbite_${currentUser}_calories`) || 0);
    currentCal += cal;
    localStorage.setItem(`fitbite_${currentUser}_calories`, currentCal);
    document.getElementById('calDisplay').innerText = currentCal;

    // 2. บันทึกลงประวัติ
    let history = JSON.parse(localStorage.getItem(`fitbite_${currentUser}_history`) || "[]");
    
    // ดึงเวลาปัจจุบันมาบันทึกด้วย
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    history.push({ name: foodName, cal: cal, time: timeNow });
    localStorage.setItem(`fitbite_${currentUser}_history`, JSON.stringify(history));

    alert(`วิเคราะห์สำเร็จ: ${foodName}\nบวกเพิ่ม ${cal} kcal ให้ ${currentUser}`);
}

// ----- ระบบเปิด/ปิด หน้าต่างประวัติ -----
function openHistory() {
    const history = JSON.parse(localStorage.getItem(`fitbite_${currentUser}_history`) || "[]");
    const listEl = document.getElementById('historyList');
    listEl.innerHTML = ""; // ล้างหน้าจอเก่า

    if(history.length === 0) {
        listEl.innerHTML = "<div class='text-center text-gray-400 mt-10'>ยังไม่มีประวัติการกินในวันนี้</div>";
    } else {
        // วนลูปสร้างรายการอาหาร
        history.forEach((item) => {
            listEl.innerHTML += `
                <li class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border shadow-sm">
                    <div>
                        <div class="font-bold text-gray-700">${item.name}</div>
                        <div class="text-xs text-gray-500 mt-1">🕒 เวลา: ${item.time}</div>
                    </div>
                    <div class="font-bold text-orange-500 bg-orange-100 px-3 py-1 rounded-full">+${item.cal} kcal</div>
                </li>
            `;
        });
    }

    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('historyModal').classList.add('hidden');
}
