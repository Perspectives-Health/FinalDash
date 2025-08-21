import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from "@/components/ui/dialog"; // Added DialogOverlay
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast"; // Import toast
import { api } from "@/services/api"; // Import the api service
// Removed SelectPrimitive import

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

interface EmailTemplate {
  name: string;
  subject: (userName: string) => string;
  body: (userName: string, links?: { activationLink?: string; loginLink?: string; feedbackLink?: string; logoUrl?: string; currentYear?: string; email?: string; }) => string;
}

const emailTemplates: { [key: string]: EmailTemplate } = {
  unactivated_account: {
    name: "Unactivated Account",
    subject: (userName) => `Activate Your Perspectives Account - ${userName}`,
    body: (userName, links) => `Hi ${userName},

Thank you for signing up. To get started and explore all the features of Perspectives, please activate your account by clicking the link below:

${links?.activationLink || '[Activation Link]'}

If you have any questions or need assistance, feel free to reply to this email.

Best regards,
The Perspectives Team`,
  },
  inactive_user: {
    name: "Inactive User",
    subject: (userName) => `We Miss You! - Perspectives - ${userName}`,
    body: (userName, links) => `Hi ${userName},

It looks like you haven't been back to Perspectives in a while. We hope everything is going well!

We've been working hard to improve the platform and add new features. We'd love to see you back.

${links?.loginLink || '[Login Link]'}

If you have any questions or feedback, please don't hesitate to reach out.

Best regards,
The Perspectives Team`,
  },
  check_in: {
    name: "Check-in",
    subject: (userName) => `Checking In From Perspectives - ${userName}`,
    body: (userName) => `Hello ${userName},

Just checking in to see how you're doing and if you need any assistance with Perspectives.

We're always here to help you get the most out of the platform.

If you have any questions, suggestions, or just want to say hi, feel free to reply to this email!

Best regards,
The Perspectives Team`,
  },
  feedback: {
    name: "Feedback",
    subject: (userName) => `Your Feedback Matters! - Perspectives - ${userName}`,
    body: (userName, links) => `Hi ${userName},

We're constantly striving to improve Perspectives and your input is invaluable.

Would you be willing to share your thoughts on your experience so far? It only takes a few minutes!

${links?.feedbackLink || '[Feedback Link]'}

Thank you for helping us make Perspectives even better.

Best regards,
The Perspectives Team`,
  },
};

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ isOpen, onClose, userEmail, userName }) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [isSending, setIsSending] = useState(false); // New state for loading indicator
  const [isSelectOpen, setIsSelectOpen] = useState(false); // New state for select dropdown open status
  const selectTriggerRef = useRef<HTMLButtonElement>(null); // Ref for the SelectTrigger
  const [selectContentStyle, setSelectContentStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setBody("");
      setSelectedTemplate("custom");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSelectOpen && selectTriggerRef.current) {
      const rect = selectTriggerRef.current.getBoundingClientRect();
      setSelectContentStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 5, // 5px offset from the trigger
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999, // Ensure it's on top
      });
    } else {
      setSelectContentStyle({}); // Clear style when closed
    }
  }, [isSelectOpen, selectTriggerRef.current]);

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (templateName === "custom") {
      setSubject("");
      setBody("");
    } else {
      const template = emailTemplates[templateName];
      if (template) {
        setSubject(template.subject(userName));
        setBody(template.body(userName, { 
          activationLink: "[Your Activation Link Here]", 
          loginLink: "[Your Login Link Here]", 
          feedbackLink: "[Your Feedback Link Here]", 
          logoUrl: "[Your Logo URL Here]", 
          currentYear: String(new Date().getFullYear()), 
          email: userEmail 
        }));
      }
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !body) {
      toast({
        title: "Missing Information",
        description: "Please enter both a subject and a body for the email.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await api.sendEmail(
        userEmail,
        subject,
        body,
        selectedTemplate === "custom" ? null : selectedTemplate,
        { username: userName, email: userEmail, current_year: new Date().getFullYear(), logo_url: "[Your Logo URL Here]", activation_link: "[Your Activation Link Here]", login_link: "[Your Login Link Here]", feedback_link: "[Your Feedback Link Here]" }
      );
      toast({
        title: "Email Sent!",
        description: `Successfully sent email to ${userEmail}.`,
      });
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Email Send Failed",
        description: `There was an error sending the email to ${userEmail}. Please try again.`, 
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return isOpen ? ReactDOM.createPortal(
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black opacity-50" /> 
      <DialogContent className={`sm:max-w-[700px] bg-white text-black ${isSelectOpen ? 'overflow-visible' : ''}`}> {/* Conditionally add overflow-visible */}
        <DialogHeader>
          <DialogTitle>Compose Email to {userEmail}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right col-span-1">Template</Label>
            <Select onValueChange={handleTemplateChange} value={selectedTemplate} onOpenChange={setIsSelectOpen}>
              <SelectTrigger ref={selectTriggerRef} className="col-span-3"> {/* Added ref */}
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="z-[9999] bg-white"> {/* Re-added SelectContent, z-index and bg-white */}
                <SelectItem value="custom">Custom Email</SelectItem>
                {Object.keys(emailTemplates).map((key) => (
                  <SelectItem key={key} value={key}>
                    {emailTemplates[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right col-span-1">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="body" className="text-right col-span-1">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="col-span-3 min-h-[150px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
    document.body // Render into the body element
  ) : null;
};

export default EmailComposerModal; 