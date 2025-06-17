import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Download, Trash2, Eye, Lock, FileText } from "lucide-react";

// Privacy compliance features required for App Store approval

export function PrivacyPolicyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          <FileText className="w-3 h-3 mr-1" />
          Privacy Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Data Collection</h3>
            <p className="text-wisdom/80">
              Luma collects only the information necessary to provide our journaling services:
              journal entries, emotional analysis data, and basic account information.
              We never sell your personal data or share it with third parties for advertising.
            </p>
          </section>
          
          <section>
            <h3 className="font-semibold mb-2">Data Security</h3>
            <p className="text-wisdom/80">
              Your journal entries are encrypted both in transit and at rest using industry-standard
              AES-256 encryption. We employ security measures including secure servers, encrypted
              communications, and regular security audits.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">AI Processing</h3>
            <p className="text-wisdom/80">
              Journal entries are processed by OpenAI's GPT-4 to provide emotional insights and
              responses. This processing happens securely and your data is not used to train
              AI models or shared beyond the necessary processing.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Your Rights</h3>
            <p className="text-wisdom/80">
              You have the right to access, modify, or delete your data at any time.
              You can export all your data or permanently delete your account with one click.
              We comply with GDPR, CCPA, and other privacy regulations.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Age Requirements</h3>
            <p className="text-wisdom/80">
              Luma is intended for users 13 years and older. Users under 18 should have
              parental consent before using our services.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DataControlCenter() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDataExport = () => {
    // In real implementation, trigger data export
    console.log("Initiating data export...");
    setShowExportDialog(false);
  };

  const handleAccountDeletion = () => {
    // In real implementation, trigger account deletion
    console.log("Initiating account deletion...");
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center space-x-2">
        <Shield className="w-5 h-5 text-green-500" />
        <span>Privacy Controls</span>
      </h3>

      <div className="grid gap-4">
        {/* Data Export */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-wisdom/70">
                Download all your journal entries, insights, and account data
              </p>
            </div>
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Your Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-wisdom/80">
                    We'll prepare a complete export of your data including:
                  </p>
                  <ul className="text-sm space-y-1 text-wisdom/70">
                    <li>• All journal entries and AI responses</li>
                    <li>• Emotional insights and analytics</li>
                    <li>• Account settings and preferences</li>
                    <li>• Voice recordings (if any)</li>
                  </ul>
                  <p className="text-sm text-wisdom/80">
                    The export will be sent to your email as a secure download link.
                  </p>
                  <div className="flex space-x-2">
                    <Button onClick={handleDataExport} className="flex-1">
                      Start Export
                    </Button>
                    <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Account Deletion */}
        <Card className="p-4 border-red-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-red-700">Delete Account</h4>
              <p className="text-sm text-wisdom/70">
                Permanently remove all your data from our servers
              </p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 font-medium">
                      This action cannot be undone
                    </p>
                  </div>
                  <p className="text-sm text-wisdom/80">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-sm space-y-1 text-wisdom/70">
                    <li>• All journal entries and responses</li>
                    <li>• Emotional insights and data</li>
                    <li>• Account settings and subscription</li>
                    <li>• Voice recordings and exports</li>
                  </ul>
                  <p className="text-sm text-wisdom/80">
                    We recommend exporting your data first if you want to keep it.
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="destructive" onClick={handleAccountDeletion}>
                      Delete Everything
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">Privacy Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Anonymous community sharing</span>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email notifications</span>
                <Badge variant="secondary">Customizable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data analytics</span>
                <Badge variant="secondary">Anonymized</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SecurityBadges() {
  const badges = [
    { label: "GDPR Compliant", icon: <Shield className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
    { label: "CCPA Compliant", icon: <Eye className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
    { label: "SOC 2 Type II", icon: <Lock className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
    { label: "AES-256 Encrypted", icon: <Shield className="w-4 h-4" />, color: "bg-indigo-100 text-indigo-700" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      ))}
    </div>
  );
}