type SendDesktopInvitationOptions = {
    recipientEmail: string;
    recipientName: string;
    inviterName: string;
    desktopName: string;
    desktopId: string;
    role: "editor" | "viewer";
};
type SendVerificationEmailOptions = {
    email: string;
    name: string;
    token: string;
};
type SendPasswordChangeEmailOptions = {
    email: string;
    name: string;
    token: string;
};
export declare function sendPasswordChangeEmail({ email, name, token, }: SendPasswordChangeEmailOptions): Promise<import("resend").CreateEmailResponseSuccess>;
export declare function sendDesktopInvitation({ recipientEmail, recipientName, inviterName, desktopName, desktopId, role, }: SendDesktopInvitationOptions): Promise<import("resend").CreateEmailResponseSuccess>;
export declare function sendVerificationEmail({ email, name, token, }: SendVerificationEmailOptions): Promise<import("resend").CreateEmailResponseSuccess>;
export {};
//# sourceMappingURL=email.d.ts.map