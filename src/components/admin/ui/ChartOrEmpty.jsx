import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const ChartOrEmpty = ({ hasData, options }) =>
  hasData ? (
    <HighchartsReact highcharts={Highcharts} options={options} />
  ) : (
    <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-white/40">
      Chưa có dữ liệu
    </div>
  );

export default ChartOrEmpty;
