import InfoFeb8OperatorDashboard from "@/ui/reports/info/InfoFeb8OperatorDashboard";
import InfoOperatorDashboard from "@/ui/reports/info/InfoOperatorDashboard";
import type { InfoOperatorConfig } from "@/ui/reports/info/infoOperatorConfigs";

type InfoOperatorPageProps = {
  config: InfoOperatorConfig;
};

export default function InfoOperatorPage({ config }: InfoOperatorPageProps) {
  if (config.type === "habilitaciones") {
    return <InfoOperatorDashboard operatorSlug={config.operatorSlug} />;
  }

  return <InfoFeb8OperatorDashboard config={config} />;
}
