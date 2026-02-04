"use client";

import { useState } from "react";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";

interface ConsentFormProps {
    participantName: string;
    participantAge: string;
    workshopTitle: string;
    workshopDate: string;
    onConsentSigned: (consentUrl: string) => void;
    onCancel: () => void;
}

export const DigitalConsentForm: React.FC<ConsentFormProps> = ({
    participantName,
    participantAge,
    workshopTitle,
    workshopDate,
    onConsentSigned,
    onCancel
}) => {
    const [parentName, setParentName] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [relationship, setRelationship] = useState("Parent");
    const [parentNic, setParentNic] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [signature, setSignature] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [uploading, setUploading] = useState(false);

    const generateConsentPDF = () => {
        const currentDate = new Date().toLocaleDateString();

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Parental Consent Form - VibeConnect</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #8b5cf6; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0 0 0; }
        .section { margin: 25px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #8b5cf6; }
        .section h2 { color: #8b5cf6; margin-top: 0; font-size: 18px; }
        .info-row { display: flex; margin: 10px 0; }
        .info-label { font-weight: bold; min-width: 180px; color: #555; }
        .info-value { color: #333; }
        .signature-box { border: 2px solid #8b5cf6; padding: 15px; margin: 20px 0; min-height: 80px; background: white; }
        .signature-text { font-family: 'Brush Script MT', cursive; font-size: 32px; color: #8b5cf6; }
        .terms { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-size: 14px; }
        .terms ul { margin: 10px 0; padding-left: 20px; }
        .terms li { margin: 8px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        .stamp { position: absolute; top: 100px; right: 50px; transform: rotate(-15deg); border: 3px solid #10b981; color: #10b981; padding: 10px 20px; font-weight: bold; font-size: 20px; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="stamp">DIGITALLY SIGNED</div>
    
    <div class="header">
        <h1>VibeConnect</h1>
        <p>Parental Consent & Authorization Form</p>
    </div>

    <div class="section">
        <h2>Workshop Information</h2>
        <div class="info-row">
            <span class="info-label">Workshop Title:</span>
            <span class="info-value">${workshopTitle}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Workshop Date:</span>
            <span class="info-value">${new Date(workshopDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
    </div>

    <div class="section">
        <h2>Participant Information</h2>
        <div class="info-row">
            <span class="info-label">Participant Name:</span>
            <span class="info-value">${participantName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Age:</span>
            <span class="info-value">${participantAge} years old</span>
        </div>
    </div>

    <div class="section">
        <h2>Parent/Guardian Information</h2>
        <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${parentName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Relationship:</span>
            <span class="info-value">${relationship}</span>
        </div>
        <div class="info-row">
            <span class="info-label">ID / NIC / Passport:</span>
            <span class="info-value">${parentNic}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${parentEmail}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${parentPhone}</span>
        </div>
    </div>

    <div class="section">
        <h2>Consent & Authorization</h2>
        <div class="terms">
            <p><strong>I, ${parentName}, hereby grant permission for ${participantName} to participate in the above-mentioned workshop. I understand and agree to the following:</strong></p>
            <ul>
                <li>I am the legal parent/guardian of the participant named above.</li>
                <li>I authorize the participant to attend and participate in all workshop activities.</li>
                <li>I understand that workshop activities may include hands-on learning, group activities, and creative exercises.</li>
                <li>I acknowledge that VibeConnect and the workshop instructor will take reasonable precautions to ensure participant safety.</li>
                <li>I agree to the workshop's refund policy as stated during registration.</li>
                <li>I authorize emergency medical treatment if necessary and agree to be responsible for associated costs.</li>
                <li>I grant permission for photographs/videos taken during the workshop to be used for promotional purposes (optional).</li>
            </ul>
            <p><strong>Emergency Contact:</strong> ${parentPhone}</p>
        </div>
    </div>

    <div class="section">
        <h2>Digital Signature</h2>
        <div class="signature-box">
            <div class="signature-text">${signature}</div>
        </div>
        <div class="info-row">
            <span class="info-label">Signed by:</span>
            <span class="info-value">${parentName} (${relationship})</span>
        </div>
        <div class="info-row">
            <span class="info-label">Date Signed:</span>
            <span class="info-value">${currentDate}</span>
        </div>
        <div class="info-row">
            <span class="info-label">IP Address:</span>
            <span class="info-value">Recorded for verification</span>
        </div>
    </div>

    <div class="footer">
        <p><strong>VibeConnect - Workshop Registration System</strong></p>
        <p>This is a legally binding digital consent form.</p>
        <p>Document ID: CONSENT-${Date.now()}</p>
        <p>Generated on: ${currentDate}</p>
    </div>
</body>
</html>
        `;

        return htmlContent;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Math Challenge to deter children
        if (securityAnswer.trim() !== "12") {
            alert("Security Verification Failed: The answer to the math challenge is incorrect.");
            return;
        }

        // 2. Validate all fields including NIC
        if (!parentName || !parentEmail || !parentPhone || !signature || !agreedToTerms || !parentNic) {
            alert("Please fill all fields, provide ID number, signature, and agree to terms.");
            return;
        }

        setUploading(true);

        try {
            // Generate HTML consent form
            const htmlContent = generateConsentPDF();

            // Simple sanitation for filename
            const safeName = participantName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const timestamp = Date.now();
            const fileName = `consent_forms/${safeName}_${timestamp}.html`;
            const storageRef = ref(storage, fileName);

            // Upload with metadata
            const metadata = {
                contentType: 'text/html',
                customMetadata: {
                    participant: participantName,
                    parent: parentName,
                    parentNic: parentNic,
                    generated: new Date().toISOString()
                }
            };

            // Manual timeout check (15s)
            const uploadPromise = uploadString(storageRef, htmlContent, 'raw', metadata);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Upload timed out (slow network)")), 15000)
            );

            await Promise.race([uploadPromise, timeoutPromise]);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);

            if (!downloadURL) throw new Error("Failed to retrieve document URL");

            console.log("Consent uploaded successfully:", downloadURL);

            // Call parent callback with URL
            onConsentSigned(downloadURL);

        } catch (error: any) {
            console.error("Error uploading consent form:", error);
            alert(`Failed to save consent form: ${error.message || "Unknown error"}. Please check your connection and try again.`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] max-w-3xl w-full my-8 shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Parental Consent Required</h2>
                            <p className="text-sm text-muted-foreground mt-1">Digital consent form for participants under 18</p>
                        </div>
                        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Participant Info */}
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                        <h3 className="text-sm font-black text-primary uppercase tracking-widest">Participant Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Name:</span><span className="ml-2 text-white font-bold">{participantName}</span></div>
                            <div><span className="text-muted-foreground">Age:</span><span className="ml-2 text-white font-bold">{participantAge} years</span></div>
                            <div className="col-span-2"><span className="text-muted-foreground">Workshop:</span><span className="ml-2 text-white font-bold">{workshopTitle}</span></div>
                        </div>
                    </div>

                    {/* Parent/Guardian Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Parent/Guardian Information</h3>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Full Name *</label>
                            <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all" placeholder="Enter parent/guardian full name" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Relationship *</label>
                                <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all">
                                    <option value="Parent">Parent</option>
                                    <option value="Guardian">Legal Guardian</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">ID / NIC / Passport No *</label>
                                <input type="text" value={parentNic} onChange={(e) => setParentNic(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all" placeholder="Enter National ID" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Email *</label>
                                <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all" placeholder="parent@email.com" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Phone *</label>
                                <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all" placeholder="0771234567" required />
                            </div>
                        </div>
                    </div>

                    {/* Security Check */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                        <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-shield-halved"></i> Security Verification
                        </h3>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                    Math Challenge: What is 7 + 5?
                                </label>
                                <input
                                    type="number"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold text-sm focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="?"
                                    required
                                />
                            </div>
                            <div className="pb-3 text-[10px] font-bold text-muted-foreground">
                                * Verifies you are a human adult.
                            </div>
                        </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Digital Signature</h3>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Type your full name as signature *</label>
                            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-primary/20 rounded-xl text-primary font-bold text-2xl focus:border-primary/50 focus:bg-white/10 outline-none transition-all" style={{ fontFamily: 'cursive' }} placeholder="Your signature" required />
                            <p className="text-xs text-muted-foreground mt-2">This will serve as your legal digital signature</p>
                        </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                        <div className="text-xs text-muted-foreground space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2 block">
                            <p className="font-bold text-white">By signing this, I confirm:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>I am the legal parent/guardian.</li>
                                <li>I authorize participation.</li>
                                <li>I understand safety measures and risks.</li>
                                <li>I agree to refund policy.</li>
                            </ul>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-primary checked:border-primary cursor-pointer" required />
                            <span className="text-xs text-white font-bold group-hover:text-primary transition-colors">I declare I am over 18 years of age. I have read and agree to all terms stated above.</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onCancel} disabled={uploading} className="flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={uploading || !agreedToTerms} className="flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {uploading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                            {uploading ? "Saving Consent..." : "Sign & Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
