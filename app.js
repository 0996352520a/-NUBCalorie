let currentUser = ""; 
let userList = []; 

window.onload = () => {
    // ดึงข้อมูลผู้ใช้เดิม
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

    localStorage.setItem(`nubcalorie_${currentUser}_profile`, JSON.stringify({weight, height, age, gender, activity, bmi, tdee}));
    
    updateDashboard(bmi, tdee);
    alert(`บันทึกข้อมูลของ ${currentUser} เรียบร้อย!`);
}

function loadProfile() {
    document.getElementById('profileNameDisplay').innerText = currentUser;
    document.getElementById('historyName').innerText = currentUser;

    const profile = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_profile`) || localStorage.getItem(`fitbite_${currentUser}_profile`));
    const calories = localStorage.getItem(`nubcalorie_${currentUser}_calories`) || localStorage.getItem(`fitbite_${currentUser}_calories`) || 0;
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

function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตแคลอรีและประวัติการกินวันนี้ของ ${currentUser} ใช่หรือไม่?`)) {
        localStorage.setItem(`nubcalorie_${currentUser}_calories`, 0);
        localStorage.removeItem(`nubcalorie_${currentUser}_history`); 
        document.getElementById('calDisplay').innerText = 0;
    }
}

async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    setTimeout(() => {
        addCalories(450, "ข้าวกะเพราไก่ไข่ดาว (ระบบจำลอง)");
    }, 2000);
}

function addCalories(cal, foodName) {
    document.getElementById('loading').classList.add('hidden');
    
    let currentCal = parseInt(localStorage.getItem(`nubcalorie_${currentUser}_calories`) || 0);
    currentCal += cal;
    localStorage.setItem(`nubcalorie_${currentUser}_calories`, currentCal);
    document.getElementById('calDisplay').innerText = currentCal;

    let history = JSON.parse(localStorage.getItem(`nubcalorie_${currentUser}_history`) || "[]");
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    history.push({ name: foodName, cal: cal, time: timeNow });
    localStorage.setItem(`nubcalorie_${currentUser}_history`, JSON.stringify(history));

    alert(`วิเคราะห์สำเร็จ: ${foodName}\nบวกเพิ่ม ${cal} kcal ให้ ${currentUser}`);
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
