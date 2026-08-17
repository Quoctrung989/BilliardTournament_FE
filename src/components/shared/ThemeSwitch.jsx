import { useThemeStore } from "../../store/themeStore";

/**
 * Công tắc Sáng ⇄ Tối kiểu ngày/đêm, dùng chung cho Header công khai và AdminHeader.
 *
 * Bật (checked) = giao diện SÁNG: nền trời xanh, mặt trời vàng, có mây.
 * Tắt = giao diện TỐI: nền đêm, mặt trăng lưỡi liềm, có sao.
 *
 * Ngược với hai nút icon trước đây — nút đó vẽ nơi SẼ ĐẾN (đang tối thì hiện mặt
 * trời), còn công tắc thì vẽ nơi ĐANG ĐỨNG. Đó là quy ước của công tắc: vị trí
 * cần của nó mang thông tin trạng thái, nên hình bên trong phải khớp với trạng
 * thái ấy, không thể chỉ hướng đi ngược lại.
 *
 * Toàn bộ tạo hình và chuyển động nằm ở `.ui-theme-switch` trong styles/global.css.
 */
const ThemeSwitch = ({ className = "" }) => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const isLight = theme !== "dark";

  return (
    <label className={`ui-theme-switch ${className}`} title={isLight ? "Chuyển tối" : "Chuyển sáng"}>
      <input
        type="checkbox"
        role="switch"
        checked={isLight}
        onChange={toggleTheme}
        aria-label="Chuyển giao diện sáng/tối"
      />
      <span className="ui-theme-switch__slider">
        <span className="ui-theme-switch__star ui-theme-switch__star--1" />
        <span className="ui-theme-switch__star ui-theme-switch__star--2" />
        <span className="ui-theme-switch__star ui-theme-switch__star--3" />

        <svg viewBox="0 0 16 16" className="ui-theme-switch__cloud" aria-hidden="true">
          <path
            transform="matrix(0.77976, 0, 0, 0.78395, -299.99, -418.63)"
            fill="#fff"
            d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
          />
        </svg>
      </span>
    </label>
  );
};

export default ThemeSwitch;
