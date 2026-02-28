import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    role: { type: String, default: 'Author' },
    avatar: { type: String, default: 'https://via.placeholder.com/150' },
    socialLinks: {
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        fieldNotes: { type: String, default: '' }
    },
    aboutText: { type: String, default: 'MyMediTalks began as a collection of quiet observations from the hospital wards—moments where rigid protocols gave way to the profound, unpredictable nature of human healing. What started as private journal entries scribbled between rounds has grown into this editorial space.\n\nI have always believed that medicine is as much an art as it is a science. While my training in cardiology taught me the mechanics of the heart, my patients taught me its capacity for resilience. This journal is dedicated to the thoughtful exploration of modern medicine, patient stories, and the healing arts.' },
    professionalPath: {
        type: [{ year: String, title: String, subtitle: String }],
        default: [
            { year: '2018 — Present', title: 'Attending Cardiologist', subtitle: "St. Mary's Teaching Hospital" },
            { year: '2015', title: 'Fellowship in Narrative Medicine', subtitle: 'Columbia University' }
        ]
    },
    aboutImages: {
        type: [{ url: String, alt: String }],
        default: [
            { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBW06eC7TUYHIeI8ylW_S5_cCKAW05xT2vUEXGGMYhFIMkMHlHx3eOx87uvvsxOjSAs2u8BugZa8eAXDVtdyLpbaULg32Kwi-OvDCqkW4J0ybxDcNkW1UK8-7fox3vy3InvpCNfw76A_xUabJsq7KMJCHcVS5IPlk5ql0L40tr8TV5hPcnrX0UooI5ydE0r0qlI2vVWNKSkuy7c4cN-h-UOtAgtsvLUYwKsnmTolE_FW_y2uHPx3hx_PcdbhCds-8QrXZsbeuKRQEQ4", alt: "Medical setup" },
            { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5NbYfIJZ-MKdvkbndM26wrN2PWDNtsngKivWlyEGW0JGaqOTCltZlrGCLc6K2i61LQc6vbNcruHAyT3KHeOPpopScC2_qRx-wmPiUfTwSZUreWty-rOgtcgl3hTRN04nDUgGL52-SWGp31cj5LeSeiMqKC7C9EVaTldhggYoMecxwwYS3BEJGHeaJLifOrThZzEL8ZYdhooM_SmGXud-0DFoG-Xp0Po94IjK5DQvw1aS4JqAc6ciMCpUmj1hWyVNuTKqqqPVcwI2k", alt: "Botanical herbs" }
        ]
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
