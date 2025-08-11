const express = require('express');
const router = express.Router();
const db = process.env.USE_MONGODB ? require('../database/mongoDatabase') : require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const BANK_ACCOUNT_FIELDS = {
  'US': {
    required: ['accountHolderName', 'routingNumber', 'accountNumber', 'accountType', 'bankName'],
    optional: ['swiftCode', 'address']
  },
  'UK': {
    required: ['accountHolderName', 'sortCode', 'accountNumber', 'bankName'],
    optional: ['swiftCode', 'iban', 'address']
  },
  'CA': {
    required: ['accountHolderName', 'institutionNumber', 'transitNumber', 'accountNumber', 'bankName'],
    optional: ['swiftCode', 'address']
  },
  'AU': {
    required: ['accountHolderName', 'bsb', 'accountNumber', 'bankName'],
    optional: ['swiftCode', 'address']
  },
  'DE': {
    required: ['accountHolderName', 'iban', 'bic', 'bankName'],
    optional: ['address']
  },
  'FR': {
    required: ['accountHolderName', 'iban', 'bic', 'bankName'],
    optional: ['address']
  },
  'IN': {
    required: ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName'],
    optional: ['swiftCode', 'address', 'panNumber']
  },
  'PK': {
    required: ['accountHolderName', 'accountNumber', 'bankName', 'branchCode'],
    optional: ['swiftCode', 'iban', 'address', 'cnic']
  },
  'JP': {
    required: ['accountHolderName', 'bankCode', 'branchCode', 'accountNumber', 'bankName'],
    optional: ['swiftCode', 'address']
  },
  'CN': {
    required: ['accountHolderName', 'accountNumber', 'bankName', 'cityCode'],
    optional: ['swiftCode', 'address']
  },
  'BR': {
    required: ['accountHolderName', 'bankCode', 'agencyNumber', 'accountNumber', 'bankName'],
    optional: ['swiftCode', 'address', 'cpfCnpj']
  },
  'MX': {
    required: ['accountHolderName', 'clabe', 'bankName'],
    optional: ['swiftCode', 'address', 'rfc']
  },
  'DEFAULT': {
    required: ['accountHolderName', 'accountNumber', 'bankName', 'country'],
    optional: ['swiftCode', 'iban', 'routingCode', 'address']
  }
};

const VALIDATION_PATTERNS = {
  'US': {
    routingNumber: /^\d{9}$/,
    accountNumber: /^\d{4,20}$/
  },
  'UK': {
    sortCode: /^\d{2}-\d{2}-\d{2}$/,
    accountNumber: /^\d{8}$/
  },
  'CA': {
    institutionNumber: /^\d{3}$/,
    transitNumber: /^\d{5}$/,
    accountNumber: /^\d{7,12}$/
  },
  'AU': {
    bsb: /^\d{6}$/,
    accountNumber: /^\d{6,9}$/
  },
  'DE': {
    iban: /^DE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/,
    bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
  },
  'FR': {
    iban: /^FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/,
    bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
  },
  'IN': {
    accountNumber: /^\d{9,18}$/,
    ifscCode: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    panNumber: /^[A-Z]{5}\d{4}[A-Z]$/
  },
  'PK': {
    accountNumber: /^\d{10,16}$/,
    branchCode: /^\d{4}$/,
    cnic: /^\d{5}-\d{7}-\d$/
  }
};

function validateBankAccount(country, accountData) {
  const fields = BANK_ACCOUNT_FIELDS[country] || BANK_ACCOUNT_FIELDS['DEFAULT'];
  const patterns = VALIDATION_PATTERNS[country] || {};
  
  const missingFields = fields.required.filter(field => !accountData[field]);
  if (missingFields.length > 0) {
    return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }
  
  for (const [field, pattern] of Object.entries(patterns)) {
    if (accountData[field] && !pattern.test(accountData[field])) {
      return { valid: false, error: `Invalid format for ${field}` };
    }
  }
  
  return { valid: true };
}

router.get('/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const bankAccounts = await db.getUserBankAccounts(req.user.id);
    
    const decryptedAccounts = bankAccounts.map(account => ({
      ...account,
      accountNumber: account.accountNumber ? '•••• •••• •••• ' + account.accountNumber.slice(-4) : '',
      routingNumber: account.routingNumber ? '••••••' + account.routingNumber.slice(-3) : '',
      sortCode: account.sortCode ? '••-••-' + account.sortCode.slice(-2) : '',
      iban: account.iban ? account.iban.slice(0, 4) + '••••••••••••••••' + account.iban.slice(-4) : ''
    }));
    
    res.json({ success: true, bankAccounts: decryptedAccounts });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bank accounts' });
  }
});

router.post('/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const { country, isPrimary, ...accountData } = req.body;
    
    if (!country) {
      return res.status(400).json({ success: false, error: 'Country is required' });
    }
    
    const validation = validateBankAccount(country, accountData);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    const encryptedAccountData = {};
    const sensitiveFields = ['accountNumber', 'routingNumber', 'sortCode', 'iban', 'ifscCode', 'bsb'];
    
    for (const [key, value] of Object.entries(accountData)) {
      if (sensitiveFields.includes(key) && value) {
        encryptedAccountData[key] = encrypt(value);
      } else {
        encryptedAccountData[key] = value;
      }
    }
    
    const bankAccountId = 'bank_' + Math.random().toString(36).substr(2, 9) + Date.now();
    const newBankAccount = {
      id: bankAccountId,
      userId: req.user.id,
      country,
      isPrimary: isPrimary || false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...encryptedAccountData
    };
    
    const result = await db.createBankAccount(newBankAccount);
    
    if (result.success) {
      const responseAccount = { ...result.bankAccount };
      const maskedAccountNumber = result.bankAccount.accountNumber 
        ? '•••• •••• •••• ' + decrypt(result.bankAccount.accountNumber).slice(-4)
        : '';
      responseAccount.accountNumber = maskedAccountNumber;
      
      res.json({ success: true, bankAccount: responseAccount });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ success: false, error: 'Failed to create bank account' });
  }
});

router.put('/bank-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { country, ...updates } = req.body;
    
    const existingAccount = await db.getBankAccountById(id);
    if (!existingAccount || existingAccount.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }
    
    if (country && country !== existingAccount.country) {
      const validation = validateBankAccount(country, updates);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }
    }
    
    const encryptedUpdates = {};
    const sensitiveFields = ['accountNumber', 'routingNumber', 'sortCode', 'iban', 'ifscCode', 'bsb'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (sensitiveFields.includes(key) && value) {
        encryptedUpdates[key] = encrypt(value);
      } else {
        encryptedUpdates[key] = value;
      }
    }
    
    const result = await db.updateBankAccount(id, {
      ...encryptedUpdates,
      country: country || existingAccount.country,
      updatedAt: new Date().toISOString()
    });
    
    if (result.success) {
      res.json({ success: true, bankAccount: result.bankAccount });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ success: false, error: 'Failed to update bank account' });
  }
});

router.delete('/bank-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingAccount = await db.getBankAccountById(id);
    if (!existingAccount || existingAccount.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }
    
    const result = await db.deleteBankAccount(id);
    
    if (result.success) {
      res.json({ success: true, message: 'Bank account deleted successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ success: false, error: 'Failed to delete bank account' });
  }
});

router.put('/bank-accounts/:id/set-primary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.setPrimaryBankAccount(req.user.id, id);
    
    if (result.success) {
      res.json({ success: true, message: 'Primary bank account updated successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error setting primary bank account:', error);
    res.status(500).json({ success: false, error: 'Failed to set primary bank account' });
  }
});

router.get('/financial-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await db.getFinancialSummary(req.user.id);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch financial summary' });
  }
});

router.get('/payout-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const payouts = await db.getPayoutHistory(req.user.id, parseInt(page), parseInt(limit));
    res.json({ success: true, payouts });
  } catch (error) {
    console.error('Error fetching payout history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payout history' });
  }
});

router.post('/initiate-payout', authenticateToken, async (req, res) => {
  try {
    const { bankAccountId, amount } = req.body;
    
    if (!bankAccountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payout request' });
    }
    
    const result = await db.initiatePayout(req.user.id, bankAccountId, amount);
    
    if (result.success) {
      res.json({ success: true, payout: result.payout });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error initiating payout:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payout' });
  }
});

router.get('/supported-countries', (req, res) => {
  const countries = Object.keys(BANK_ACCOUNT_FIELDS)
    .filter(country => country !== 'DEFAULT')
    .map(code => ({
      code,
      name: getCountryName(code),
      fields: BANK_ACCOUNT_FIELDS[code]
    }));
  
  res.json({ success: true, countries });
});

function getCountryName(code) {
  const countryNames = {
    'US': 'United States',
    'UK': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia', 
    'DE': 'Germany',
    'FR': 'France',
    'IN': 'India',
    'PK': 'Pakistan',
    'JP': 'Japan',
    'CN': 'China',
    'BR': 'Brazil',
    'MX': 'Mexico'
  };
  return countryNames[code] || code;
}

module.exports = router;