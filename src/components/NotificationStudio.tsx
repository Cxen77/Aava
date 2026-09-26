import { useState } from "react";
import { Play } from "lucide-react";
import { SaathiNotification } from "./SaathiNotification";
import { emotionSamples, sampleNotifications, type NotificationType } from "@/data/notifications";

type Props = { onNavigate: (type: NotificationType) => void };

export function NotificationStudio({ onNavigate }: Props) {
  const [keys, setKeys] = useState<Record<string, number>>({});
  const replay = (id: string) => setKeys(k => ({ ...k, [id]: (k[id] ?? 0) + 1 }));
  const Item = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div className="pb-2">
      {children}
      <button onClick={() => replay(id)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"><Play className="size-3" /> Play animation</button>
    </div>
  );
  return (
    <div className="space-y-4 px-5 pb-10">
      <p className="pt-3 text-sm text-muted-foreground">Preview of every SAATHI notification. These are design previews only — nothing is sent.</p>
      <h2 className="pt-2 text-sm font-semibold">Cat emotions</h2>
      {emotionSamples.map(e => <Item key={e.emotion} id={e.emotion}><SaathiNotification emotion={e.emotion} title={e.title} message={e.message} playKey={keys[e.emotion] ?? 0} /></Item>)}
      <h2 className="pt-4 text-sm font-semibold">Notification types</h2>
      {sampleNotifications.map(n => <Item key={n.type} id={`t-${n.type}`}><SaathiNotification {...n} playKey={keys[`t-${n.type}`] ?? 0} onAction={() => onNavigate(n.type)} /></Item>)}
    </div>
  );
}
