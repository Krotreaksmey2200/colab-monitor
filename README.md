# ⚡ Colab Monitor & Anti-Disconnect Hub PRO 24H

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Krotreaksmey2200/colab-monitor/blob/main/fine_tuning_kh_30epoch.ipynb)

> **Live Website Hosting via GitHub Pages:** ឧបករណ៍ការពារកុំឱ្យដាច់ Google Colab, កន្លែង Upload & Inject Keep-Alive លើ Jupyter Notebooks, និងផ្ទាំងតាមដានការបង្វឹក AI OCR (Live Telemetry Monitor)

## 🌟 លក្ខណៈពិសេសចម្បង (Key Features)

- **📂 Colab Notebook Hub (.ipynb):** 
  - **🚀 Open in Colab 1-Click:** បើកឯកសារ `fine_tuning_kh_30epoch.ipynb` លើ Google Colab ភ្លាមៗដោយចុចតែ ១ ប៊ូតុង
  - **📤 Interactive Upload & Injector:** អូសទម្លាក់ (Drag & Drop) File `.ipynb` ផ្ទាល់ខ្លួន ដើម្បីចាក់បញ្ចូល Keep-Alive Script នៅ Cell ទីមួយ និងទាញយកមកវិញ
  - **👁️ Cell Inspector & Code Copier:** មើលកោសិកាកូដ និងចម្លង Python scripts ទាំងអស់ដោយស្រួល
- **⚡ One-Click Bookmarklet:** អូសប៊ូតុងដាក់លើ Bookmark Bar នៃ Browser រួចចុច Keep-Alive លើ Colab ដោយមិនបាច់បើក Console F12 រាល់ដង
- **📋 Auto-Script Generator:** ផ្ដល់កូដ JavaScript ស្វ័យប្រវត្តិតាមជម្រើស Interval (30s, 60s, 120s)
- **🛡️ Screen Wake Lock & Silent Audio Loop:** ការពារកុំឱ្យ Mac / PC គេង (Sleep) ពេលបើកចោលពេលយប់
- **📊 OCR Live Training Monitor:** ផ្ទាំងតាមដាន Epoch, Loss, CER, និងលទ្ធផលសាកល្បងជាក់ស្ដែងលើ HTML5 Canvas

## 📁 ឯកសារ Notebooks ក្នុងគម្រោងនេះ

1. **`fine_tuning_kh_30epoch.ipynb`** (Google Colab):
   - Fine-tune Khmer & Math PARSeq OCR 30 Epochs ជាមួយ LoRA (Rank 16)
   - Save checkpoint រាល់ 1 epoch លើ Google Drive និង Auto-resume ប្រសិនបើដាច់ Connection
   - Auto-merge LoRA ទៅកាន់ standalone PyTorch model
2. **`fine_tuning_kh_30epoch_kaggle.ipynb`** (Kaggle GPU):
   - គាំទ្រ Dual T4/P100 GPUs លើ Kaggle
   - កែសម្រួល Batch Tensor Generator និងប្រើ PyTorch 2.x Autocast Standard

## 🚀 How to use GitHub Pages
1. Go to repository **Settings** -> **Pages**
2. Under **Build and deployment** -> **Branch**, select `main` and `/ (root)`
3. Click **Save**
4. Your website will be live at: `https://krotreaksmey2200.github.io/colab-monitor/`

