# DEVELOPMENT RULES & WORKFLOW

## 🎯 Mục đích
Tài liệu này định nghĩa quy trình làm việc để đảm bảo chất lượng code và tránh bỏ sót tính năng khi refactor/cập nhật code.

---

## 📋 QUY TẮC CHUNG

### 1. Trước khi thay đổi code lớn (Refactor/Restructure)

#### ✅ BẮT BUỘC:
- [ ] Tạo **backup branch** trước khi bắt đầu
  ```bash
  git checkout -b backup/feature-name-YYYYMMDD
  git push origin backup/feature-name-YYYYMMDD
  ```
- [ ] Tạo **Implementation Plan** chi tiết trong `implementation_plan.md`
- [ ] Liệt kê **TẤT CẢ các function/logic** sẽ bị ảnh hưởng
- [ ] Ghi chú **dependencies** (function A gọi function B ở đâu, khi nào)
- [ ] **Request review** từ user trước khi code

#### 📝 Implementation Plan phải bao gồm:
1. **Affected Components**: Liệt kê tất cả file, function, logic sẽ thay đổi
2. **Dependencies Map**: Function nào gọi function nào
3. **Test Checklist**: Tính năng nào cần test sau khi sửa
4. **Rollback Plan**: Cách quay lại nếu có vấn đề

---

## 🔍 CHECKLIST THEO LOẠI THAY ĐỔI

### A. Thay đổi UI/Layout (HTML/CSS)

**Trước khi sửa:**
- [ ] View toàn bộ HTML structure hiện tại
- [ ] Identify tất cả element IDs được JavaScript sử dụng
- [ ] Check responsive breakpoints (mobile/tablet/desktop)

**Khi sửa:**
- [ ] Giữ nguyên hoặc duplicate element IDs nếu cần thiết
- [ ] Đảm bảo event handlers (`onclick`, `oninput`) không bị mất
- [ ] Test trên cả mobile và desktop

**Sau khi sửa - Verify:**
- [ ] Tất cả buttons/inputs vẫn hoạt động
- [ ] Form submission vẫn work
- [ ] Responsive layout đúng trên mobile/tablet/desktop
- [ ] Không có element nào bị ẩn/mất do CSS

---

### B. Thay đổi Form/Input Logic

**Trước khi sửa:**
- [ ] Liệt kê tất cả form fields (IDs, names, types)
- [ ] Check function nào đọc/ghi dữ liệu từ form
- [ ] Identify validation logic
- [ ] Check score calculation dependencies

**Khi sửa:**
- [ ] Nếu duplicate form (mobile + desktop), đảm bảo sync logic
- [ ] Giữ nguyên validation rules
- [ ] Update cả read và write operations

**Sau khi sửa - Verify:**
- [ ] Form population (load dữ liệu đã lưu) ✅
- [ ] Form submission (gửi dữ liệu mới) ✅
- [ ] Validation rules vẫn hoạt động ✅
- [ ] Score calculation cập nhật đúng ✅
- [ ] Cả mobile và desktop form đều work ✅

---

### C. Thay đổi Score/Progress Calculation

**Trước khi sửa:**
- [ ] Document công thức tính điểm hiện tại
- [ ] Liệt kê tất cả nơi gọi `calculateLiveScore()`
- [ ] Check video progress tracking logic
- [ ] Identify tất cả score display elements

**Khi sửa:**
- [ ] Giữ nguyên công thức trừ khi có yêu cầu thay đổi
- [ ] Update cả mobile và desktop displays
- [ ] Đảm bảo real-time updates vẫn hoạt động

**Sau khi sửa - Verify:**
- [ ] Video progress tracking updates ✅
- [ ] Live score calculation (khi nhập liệu) ✅
- [ ] Score display khi load bài đã hoàn thành ✅
- [ ] Tất cả 5 phần điểm hiển thị đúng ✅
- [ ] Tổng điểm tính đúng (max 10) ✅

---

### D. Thay đổi JavaScript Functions

**Trước khi sửa:**
- [ ] Grep search function name để tìm tất cả nơi gọi
- [ ] Document parameters và return values
- [ ] Check side effects (DOM updates, API calls)

**Khi sửa:**
- [ ] Giữ nguyên function signature nếu có thể
- [ ] Nếu thay đổi parameters, update TẤT CẢ nơi gọi
- [ ] Maintain backward compatibility nếu cần

**Sau khi sửa - Verify:**
- [ ] Function hoạt động với old data ✅
- [ ] Function hoạt động với new data ✅
- [ ] Không có console errors ✅
- [ ] Side effects vẫn đúng ✅

---

## 🐛 DEBUGGING WORKFLOW

> **CRITICAL**: Debugging MUST follow a systematic approach. DO NOT guess or fix multiple things at once.

### Step 1: Verify Function is Called

**ALWAYS add debug logging as the FIRST step:**

```javascript
function myFunction() {
    console.log('myFunction: START');  // ← ADD THIS FIRST
    
    // ... rest of code
}
```

**Interpretation:**
- ✅ **Log appears** → Function IS called, debug logic inside
- ❌ **No log** → Function NOT called OR doesn't exist → Check:
  - Is function defined? (Check for syntax errors)
  - Is function in correct scope? (Try `window.functionName = function()`)
  - Is function being overridden elsewhere?

### Step 2: Hard Reload Properly

**Browser cache is EXTREMELY persistent:**

1. **First attempt**: `Ctrl + Shift + R` (hard reload)
2. **If still cached**: Close ALL browser tabs → Reopen browser
3. **If STILL cached**: Clear browser cache manually
4. **Nuclear option**: Open in Incognito/Private mode

### Step 3: Scope Issues

**Common JavaScript scope problems:**

```javascript
// ❌ BAD: Function may not be accessible globally
function calculateLiveScore() { ... }

// ✅ GOOD: Explicitly assign to window object
window.calculateLiveScore = function() { ... }

// ✅ ALSO GOOD: Module pattern
const myModule = {
    calculateLiveScore: function() { ... }
};
```

### Step 4: Incremental Debugging

**Fix ONE thing at a time:**

```markdown
1. Add console.log → Test → Verify log appears
2. Fix ONE issue → Test → Verify fix works
3. Fix NEXT issue → Test → Verify fix works
4. Never fix multiple issues in parallel!
```

### Step 5: Debug Data Flow

**Log data at EVERY transformation:**

```javascript
function processData(input) {
    console.log('Input:', input);  // ← Log input
    
    const transformed = transform(input);
    console.log('After transform:', transformed);  // ← Log intermediate
    
    const result = calculate(transformed);
    console.log('Final result:', result);  // ← Log output
    
    return result;
}
```

---

## 🚨 DEBUGGING ANTI-PATTERNS

### ❌ NEVER DO THESE:

1. **Guessing without evidence**
   ```javascript
   // ❌ "Maybe it's a timing issue, let me add setTimeout"
   // ❌ "Maybe it's the form data, let me change how I read it"
   // → Add console.log FIRST to gather evidence!
   ```

2. **Fixing multiple things at once**
   ```javascript
   // ❌ Changing logic + adding setTimeout + refactoring all at once
   // ✅ Change ONE thing → Test → Next thing
   ```

3. **Skipping console.log**
   ```javascript
   // ❌ "I think I know what's wrong, let me fix it directly"
   // ✅ ALWAYS verify with console.log first
   ```

4. **Not using try-catch for mysterious errors**
   ```javascript
   // ❌ Function silently fails, no idea why
   // ✅ Wrap in try-catch to see the actual error
   try {
       // ... code
   } catch (error) {
       console.error('ERROR:', error);
       console.error('Stack:', error.stack);
   }
   ```

---

## 🧪 TESTING WORKFLOW


### Sau MỖI thay đổi code, tự test:

#### 1. **Basic Functionality Test**
- [ ] Page loads without errors
- [ ] No console errors
- [ ] All buttons clickable
- [ ] Forms submittable

#### 2. **Feature-Specific Test** (tùy theo thay đổi)
- [ ] Test tính năng vừa sửa
- [ ] Test tính năng liên quan (dependencies)
- [ ] Test edge cases

#### 3. **Regression Test** (đảm bảo không phá code cũ)
- [ ] Load bài học mới (chưa làm)
- [ ] Load bài học đang làm (in progress)
- [ ] Load bài học đã hoàn thành (completed)
- [ ] Submit bài mới
- [ ] Update bài đã submit
- [ ] Video playback và progress tracking
- [ ] Auto-advance sau khi hoàn thành

#### 4. **Cross-Device Test**
- [ ] Desktop (> 1024px)
- [ ] Tablet (768px - 1024px)
- [ ] Mobile (< 768px)

---

## ⚠️ RED FLAGS - Khi nào cần EXTRA cẩn thận

### 🚨 Cảnh báo cao:
- Thay đổi HTML structure có element IDs
- Refactor function được gọi nhiều nơi
- Thay đổi logic tính điểm/progress
- Duplicate code (mobile + desktop)
- Thay đổi API calls/responses

### 🔴 Action khi gặp Red Flag:
1. **STOP** - Không code ngay
2. **PLAN** - Tạo implementation plan chi tiết
3. **REVIEW** - Request user review plan
4. **BACKUP** - Tạo backup branch
5. **CODE** - Implement theo plan
6. **TEST** - Full regression test
7. **VERIFY** - User acceptance test

---

## 📝 COMMIT MESSAGE GUIDELINES

### Format:
```
<type>: <short description>

<detailed description if needed>

Tested:
- [ ] Feature X
- [ ] Feature Y
- [ ] Regression test passed
```

### Types:
- `feat`: Tính năng mới
- `fix`: Sửa bug
- `refactor`: Refactor code (không thay đổi behavior)
- `style`: Thay đổi UI/CSS
- `docs`: Cập nhật documentation
- `test`: Thêm/sửa tests

### Example:
```
feat: Implement three-column desktop layout

- Added right sidebar for assignment form on desktop
- Updated CSS grid layout (350px | 1fr | 400px)
- Duplicated form fields with -desktop suffix
- Mobile layout unchanged

Tested:
- [x] Desktop form submission
- [x] Mobile form submission
- [x] Score calculation on both layouts
- [x] Data loading for completed lessons
- [x] Responsive breakpoints
```

---

## 🔄 ROLLBACK PROCEDURE

### Khi phát hiện bug sau khi merge:

1. **Assess Impact**
   - Bug ảnh hưởng tính năng nào?
   - Có block user không?

2. **Quick Fix vs Rollback**
   - Nếu fix < 15 phút → Quick fix
   - Nếu fix > 15 phút → Rollback

3. **Rollback Steps**
   ```bash
   # Quay lại backup branch
   git checkout backup/feature-name-YYYYMMDD
   
   # Tạo branch mới từ backup
   git checkout -b hotfix/revert-feature-name
   
   # Push và deploy
   git push origin hotfix/revert-feature-name
   ```

4. **Post-Rollback**
   - Analyze root cause
   - Update DEVELOPMENT_RULES nếu cần
   - Re-implement với plan tốt hơn

---

## ✅ DEFINITION OF DONE

### Một thay đổi code được coi là "DONE" khi:

- [ ] Code đã được test đầy đủ (basic + feature + regression)
- [ ] Không có console errors
- [ ] Mobile + Desktop đều hoạt động
- [ ] Tất cả tính năng cũ vẫn work
- [ ] Code đã được commit với message rõ ràng
- [ ] User đã verify và approve
- [ ] Documentation đã được update (nếu cần)

---

## 📚 RESOURCES

### Quick Reference:
- **Implementation Plan Template**: `implementation_plan.md`
- **Task Tracking**: `task.md`
- **Walkthrough**: `walkthrough.md`

### Common Pitfalls:
1. ❌ Sửa HTML structure mà quên update JavaScript selectors
2. ❌ Duplicate form nhưng quên sync data giữa mobile/desktop
3. ❌ Refactor function nhưng quên update nơi gọi
4. ❌ Thay đổi CSS breakpoint nhưng quên test responsive
5. ❌ Thêm tính năng mới nhưng quên gọi trong existing flow

---

## 🎓 LESSONS LEARNED

### Case Study: Three-Column Layout Refactor

**Vấn đề:**
- Sau khi refactor UI thành 3 cột, quên gọi `calculateLiveScore()` khi load bài đã hoàn thành
- Kết quả: Điểm tạm tính không cập nhật

**Root Cause:**
- Không có checklist cụ thể cho form-related changes
- Không test regression đầy đủ trước khi notify user

**Prevention:**
- Luôn tạo implementation plan trước khi refactor
- Follow checklist "B. Thay đổi Form/Input Logic"
- Test cả "load new lesson" và "load completed lesson"

### Case Study: calculateLiveScore Not Working on Desktop

**Vấn đề:**
- Mobile hiển thị điểm tạm tính đúng
- Desktop KHÔNG hiển thị điểm (luôn 0/10)
- Console không có log từ `calculateLiveScore()`

**Debugging Process (FAILED attempts):**
1. ❌ Suy đoán: "Có thể do timing issue" → Thêm setTimeout → Vẫn không work
2. ❌ Suy đoán: "Có thể do form không populate" → Sửa logic populate → Vẫn không work
3. ❌ Suy đoán: "Có thể do đọc form sai" → Đổi cách đọc form → Vẫn không work

**Root Cause (sau khi thêm console.log):**
- Function `calculateLiveScore()` bị **scope issue**
- Function declaration không accessible từ event handlers
- Browser cache code cũ

**Solution:**
```javascript
// ❌ BEFORE (không work)
function calculateLiveScore() { ... }

// ✅ AFTER (work)
window.calculateLiveScore = function() { ... }
```

**Lessons Learned:**
1. **ALWAYS add console.log FIRST** để verify function được gọi
2. **DON'T guess** - gather evidence trước
3. **Fix ONE thing at a time** - không sửa nhiều thứ cùng lúc
4. **Scope matters** - global functions nên gán vào `window`
5. **Hard reload properly** - đóng browser hoàn toàn nếu cache cứng đầu

**Time wasted**: ~30 phút debugging vòng vo
**Correct approach**: Nên mất 5 phút nếu add console.log từ đầu

---

**Last Updated**: 2026-02-08
**Version**: 1.1
