////// Global Variables //////
// --- API Settings //
const BASE_URL = 'https://randomuser.me/api/'
const INC_PARAMETER = '?inc=name,gender,dob,location,email,picture,login'
const RESULTS_NUM = '&results=100'
const SEED = '&seed=dataPanel'
const BASE_REQUEST = BASE_URL + INC_PARAMETER + RESULTS_NUM
const INDEX_URL = BASE_REQUEST + SEED

// --- DOM Settings//
const dataPanel = document.querySelector('#data-panel')
const devtoolList = document.querySelector('#devtool-list')
const navbar = document.querySelector('#navbar')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-form-input')
const paginator = document.querySelector('#paginator')
const friendModalFooter = document.querySelector('#friend-modal-footer')
const backToTopBtn = document.querySelector('#back-to-top-btn')
const cancelSearch = document.querySelector('#cancel-search')

// --- Data Settings //
let friends = JSON.parse(localStorage.getItem('friendDataFromAPI')) || []
let filteredFriends = []

// --- General Settings //
const FRIENDS_PER_PAGE = 12
let isScrolled = false


////// Executing //////
// --- Render Friend List by Getting Data from API //
if (friends && friends.length === 0) {
  // 第一次載入時，從API取得將資料並儲存至local storage
  axios.get(INDEX_URL).then((response) => { 
    friends.push(...response.data.results)
    localStorage.setItem('friendDataFromAPI', JSON.stringify(friends))
    renderPaginator(friends.length)
    renderFriendList(getFriendsByPage(1))
    console.log('Render from API') // 測試用
  })
} else {
  // 非第一次載入，直接從本地資料渲染
  renderPaginator(friends.length)
  renderFriendList(getFriendsByPage(1))
  console.log('Render from local storage') // 測試用
}



////// Event Listeners //////
// --- DevTool List Click Event //
devtoolList.addEventListener('click', function onDevtoolClick(event) {
  if (event.target.matches('.shuffle-seed')) {
    changeSeed('random')
  } else if (event.target.matches('.reset-seed')) {
    changeSeed('reset')
  } else if (event.target.matches('.clear-local-storage')) {
    clearLocalStorage('friendDataFromAPI')
    clearLocalStorage('friendInMyList')
  }
})

// --- Scroll Event: Hide Navbar //
window.addEventListener('scroll', () => {
  // 取得滾動位置
  const scrollY = window.scrollY;

  // 若頁面已經向下滾動且滾動標籤尚未更改
  if (scrollY > 100 && !isScrolled) {
    isScrolled = true; // 設定已滾動
    navbar.classList.add('navbar-scrolled') // 調整navbar透明度

  // 若頁面回歸頂端
  } else if (scrollY <= 100 && isScrolled) {
    isScrolled = false; // 設定為未滾動
    navbar.classList.remove('navbar-scrolled') // 回覆navbar樣式
  }
});

// --- Card Click Event //
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.friend-card')) {
    // 取得對應 id 並執行 show friend modal 功能
    console.log('uuid:', event.target.dataset.id) // 檢查用
    showFriendModal(event.target.dataset.id)
  }
})

// --- Search Form Submitted //
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  // 取消瀏覽器預設設定
  event.preventDefault()
  // 取得 input 之搜尋關鍵字
  const keyword = searchInput.value.trim().toLowerCase()

  // 錯誤處理
  if (!keyword.length) {
    return alert('請輸入有效字串！')
  }

  // 比對關鍵字進行篩選
  filteredFriends = friends.filter((friend) =>
    friend.name.first.trim().toLowerCase().includes(keyword) || friend.name.last.trim().toLowerCase().includes(keyword) || friend.location.country.trim().toLowerCase().includes(keyword) || friend.location.city.trim().toLowerCase().includes(keyword)
  )

  // 搜尋不到結果時的頁面處理 (以重新渲染頁面處理)
  if (!filteredFriends.length) {
    dataPanel.innerHTML = `
    <div class="col-sm-12">
      <div class="mb-2">
        <p>Unable to find any user related to the keyword ' <em>${keyword}</em> '.</p>
      </div>
    </div>
  `
    renderPaginator(filteredFriends.length)
    return
  }
  // 重新渲染頁面
  renderPaginator(filteredFriends.length)
  renderFriendList(getFriendsByPage(1))
})

// --- Cancel Search //
cancelSearch.addEventListener('click', function onCancelSearchClicked(event) {
  if (filteredFriends && filteredFriends.length > 0) {
    filteredFriends = []
    renderPaginator(friends.length)
    renderFriendList(getFriendsByPage(1))
    console.log('Cancel Search') // 測試用
  }
})

// --- Modal Footer Click Event (Like & Dislike) //
friendModalFooter.addEventListener('click', function onModalFooterClick(event) {
  if (event.target.matches('.like')) {
    addToMyList(event.target.dataset.id)
  } else if (event.target.matches('.dislike')) {
    console.log('dislike:', event.target.dataset.id)
  }
})

// --- Paginator Click Event //
paginator.addEventListener('click', function onPaginatorClicked(event) {
  if (event.target.tagName !== 'A') { return }
  
  // event.preventDefault()
  const page = Number(event.target.dataset.page)
  renderFriendList(getFriendsByPage(page))
})

// --- Scroll Event: Show Back to Top Button //
// 待優化 -> Debounce(在一定的時間內，只取最後一次的事件), throttle（固定時間觸發一次監聽）
window.addEventListener('scroll', () => {
  // 滾動高度超過一定值後才顯示按鈕
  if (window.scrollY > 300) {
    backToTopBtn.style.display = 'block';
  } else {
    backToTopBtn.style.display = 'none';
  }
});

// --- Back to Top Button Click Event //
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // 平滑捲動效果
  });
});


////// Functions //////
function renderFriendList(data) {
  let rawHTML = ''
  data.forEach(item => {
    // Set Local Variables
    const id = item.login.uuid
    const name = `${item.name.first} ${item.name.last}`
    const gender = getGenderIconClass(item.gender)
    const age = item.dob.age
    const img = item.picture.large
    const country = item.location.country

    // HTML Content of Card
    rawHTML += `
      <div class="col-sm-3">
        <div class="mb-2">
          <div class="card friend-card" data-bs-toggle="modal" data-bs-target="#friend-modal" data-id="${id}">
            <div class="friend-card card-body d-flex flex-column align-items-center" data-id="${id}">
              <img src="${img}" alt="avatar" class="card-img mb-3 friend-card" data-id="${id}">
              <h5 class="card-name mb-3 friend-card" data-id="${id}">${name}</h5>
              <div class="d-flex friend-card" data-id="${id}">
                <div>
                  <i class="${gender} card-gender friend-card" data-id="${id}"></i>
                  <span class="friend-card" data-id="${id}">${age}</span>
                </div>
                <div class="card-country ms-2 friend-card" data-id="${id}">${country}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  });

  // Render
  dataPanel.innerHTML = rawHTML
}

function getGenderIconClass(gender) {
  if (gender === 'female') {
    return 'fa-solid fa-venus'
  } else if (gender === 'male') {
    return 'fa-solid fa-mars'
  }
}

function changeSeed(order) {
  if (order === 'random') {
    // 指令為'radom'時，隨機產生10個數字組成的seed
    let RANDOM_SEED = '&seed='
    for (let i = 0; i < 10; i++) {
      RANDOM_SEED += Math.floor(Math.random() * 10)
    }
    const NEW_INDEX_URL = BASE_REQUEST + RANDOM_SEED // 更改API請求位址
    friends = [] // 清空資料清單
    axios.get(NEW_INDEX_URL).then((response) => {
      friends.push(...response.data.results)
      localStorage.setItem('friendDataFromAPI', JSON.stringify(friends))
      renderPaginator(friends.length)
      renderFriendList(getFriendsByPage(1))
      console.log('Random Seed:', RANDOM_SEED) // 檢查用
    })
  } else if (order === 'reset') {
    // 指令為'reset'時，以預設seed重新取得初始API回傳資料
    friends = []
    axios.get(INDEX_URL).then((response) => {
      friends.push(...response.data.results)
      localStorage.setItem('friendDataFromAPI', JSON.stringify(friends))
      renderPaginator(friends.length)
      renderFriendList(getFriendsByPage(1))
      console.log('Reset Default Seed') // 檢查用
    })
  }
}

function clearLocalStorage(key) {
  localStorage.removeItem(key)
}

function showFriendModal(id) {
  const modalTitle = document.querySelector('#friend-modal-title')
  const modalImage = document.querySelector('#friend-modal-image')
  const modalGender = document.querySelector('#friend-modal-gender')
  const modalDob = document.querySelector('#friend-modal-dob')
  const modalLocation = document.querySelector('#friend-modal-location')
  const modalEmail = document.querySelector('#friend-modal-email')
  const modalFooter = document.querySelector('#friend-modal-footer')

  // 取得對應資料
  const data = friends.find((friend) => friend.login.uuid === id)

  // 將原始 modal 之 HTML content 置換成對應資料
  modalTitle.innerText = `${data.name.first} ${data.name.last}`
  modalImage.src = data.picture.large
  modalGender.innerText = data.gender
  modalDob.innerText = data.dob.date.slice(0, 10)
  modalLocation.innerText = `${data.location.city}, ${data.location.country}`
  modalEmail.innerText = data.email
  modalFooter.innerHTML = `
    <div class="like like-btn" id="add-like" data-id="${id}">
      <i class="fa-solid fa-heart like" data-id="${id}"></i><span class="ms-2 like" data-id="${id}">Like</span>
    </div>
    <div class="dislike dislike-btn ms-4" id="add-dislike" data-id="${id}">
      <i class="fa-solid fa-thumbs-down dislike" data-id="${id}"></i><span class="ms-2 dislike" data-id="${id}">Dislike</span>
    </div>
  `
}

function getFriendsByPage(page) {
  const data = filteredFriends.length ? filteredFriends : friends
  // 計算起始 index
  const startIndex = (page - 1) * FRIENDS_PER_PAGE
  // 回傳切割後的陣列
  return data.slice(startIndex, startIndex + FRIENDS_PER_PAGE)
}

function renderPaginator(amount) {
  // 計算總共需要的頁數
  numberOfPages = Math.ceil(amount / FRIENDS_PER_PAGE)
  // 建立 paginator 的 HTML content
  let rawHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#hd" data-page="${page}">${page}</a></li>`
  }
  paginator.innerHTML = rawHTML
}

function addToMyList(id) {
  // 自 local storage 取得我的清單（localStorage 只能儲存字串，取得時須先用 JSON.parse 轉回物件）
  const list = JSON.parse(localStorage.getItem('friendInMyList')) || []

  // 比對點擊對象是否已存在於我的清單，若已重複則return
  if (list.some((friend) => friend.login.uuid === id)) {
    return alert('已經按過喜歡囉!可以在My List看到這位朋友。')
  }

  // 未重複則加入清單
  const friend = friends.find((friend) => friend.login.uuid === id)
  list.push(friend)
  // 儲存至local storage（需先將陣列 'list' 轉為 JSON 字串）
  localStorage.setItem('friendInMyList', JSON.stringify(list))
}


///// Edit //////
