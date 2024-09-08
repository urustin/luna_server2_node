// utils/date.js

/**
 * 주어진 날짜의 다음 주 월요일 날짜를 반환합니다.
 * @param {Date} date - 기준이 되는 날짜
 * @returns {Date} 다음 주 월요일의 날짜
 */
const getNextMonday = (date = new Date()) => {
    const resultDate = new Date(date);
    resultDate.setDate(date.getDate() + (8 - date.getDay()) % 7 + 1);
    return formatDate(resultDate);
}

const getCurrentMonday = (date = new Date()) => {
    const resultDate = new Date(date);
    resultDate.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    return formatDate(resultDate);
}
  
/**
 * 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환합니다.
 * @param {Date} date - 변환할 날짜
 * @returns {string} 'YYYY-MM-DD' 형식의 날짜 문자열
 */
const formatDate = (date)=> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export {
    getNextMonday,
    getCurrentMonday,
    formatDate,
}