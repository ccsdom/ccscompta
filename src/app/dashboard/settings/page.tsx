import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle>Bientôt disponible</CardTitle>
          <p className="text-muted-foreground mt-2">La page des paramètres est en cours de construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
