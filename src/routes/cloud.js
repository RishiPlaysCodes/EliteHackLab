const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/cloud/index', {
    title: 'Cloud Security Labs',
    labs: [
      { id: 's3-open', name: 'S3 Bucket Misconfiguration', difficulty: 'Easy', path: '/labs/cloud/s3' },
      { id: 'metadata', name: 'Cloud Metadata Attack (IMDS)', difficulty: 'Medium', path: '/labs/cloud/metadata' },
      { id: 'iam', name: 'IAM Privilege Escalation', difficulty: 'Hard', path: '/labs/cloud/iam' },
      { id: 'container', name: 'Container Escape Concepts', difficulty: 'Hard', path: '/labs/cloud/container' },
      { id: 'serverless', name: 'Serverless Injection', difficulty: 'Medium', path: '/labs/cloud/serverless' },
    ]
  });
});

// Simulated S3 bucket
const s3Buckets = {
  'company-public': { acl: 'public-read', files: ['logo.png', 'about.html', 'styles.css'] },
  'company-backups': { acl: 'public-read-write', files: ['db-backup-2024.sql', 'users-export.csv', 'ssh-keys.tar.gz', 'FLAG-s3-exposed.txt'] },
  'company-internal': { acl: 'private', files: ['config.yml', 'secrets.env', '.aws/credentials'] },
  'dev-deployments': { acl: 'public-read', files: ['.env', 'docker-compose.yml', 'terraform.tfstate', 'FLAG{s3_bucket_exposed}'] },
};

router.get('/s3', (req, res) => { res.render('labs/cloud/s3', { title: 'S3 Bucket Misconfiguration', labId: 'cloud-s3-open' }); });

router.get('/s3/list', (req, res) => {
  const { bucket } = req.query;
  if (!bucket) return res.json({ success: true, buckets: Object.keys(s3Buckets), hint: 'Try listing each bucket' });
  
  const b = s3Buckets[bucket];
  if (!b) return res.json({ success: false, error: 'NoSuchBucket' });
  if (b.acl === 'private') return res.json({ success: false, error: 'AccessDenied' });
  
  res.json({ success: true, bucket, acl: b.acl, files: b.files, flag: b.files.some(f => f.includes('FLAG')) ? 'FLAG{s3_bucket_exposed}' : undefined });
});

// Simulated IMDS
router.get('/metadata', (req, res) => { res.render('labs/cloud/metadata', { title: 'Cloud Metadata (IMDS)', labId: 'cloud-metadata' }); });

router.get('/metadata/latest/*', (req, res) => {
  const path = req.params[0] || '';
  const metadataTree = {
    '': ['meta-data/', 'user-data/'],
    'meta-data': ['ami-id', 'instance-id', 'instance-type', 'local-ipv4', 'iam/', 'hostname', 'security-groups'],
    'meta-data/ami-id': 'ami-0123456789abcdef0',
    'meta-data/instance-id': 'i-0abcdef1234567890',
    'meta-data/instance-type': 't2.micro',
    'meta-data/local-ipv4': '10.0.1.50',
    'meta-data/hostname': 'ip-10-0-1-50.internal',
    'meta-data/security-groups': 'sg-default\nsg-web-server\nsg-admin-FULL-ACCESS',
    'meta-data/iam': ['security-credentials/'],
    'meta-data/iam/security-credentials': ['admin-role'],
    'meta-data/iam/security-credentials/admin-role': JSON.stringify({
      Code: 'Success',
      AccessKeyId: 'ASIAFAKEKEY123456',
      SecretAccessKey: 'FakeSecretKey/+AbCdEfGhIjKlMnOpQrStUvWx',
      Token: 'FakeSessionToken...FLAG{imds_token_stolen}',
      Expiration: '2024-12-31T23:59:59Z'
    }, null, 2),
    'user-data': '#!/bin/bash\nexport DB_PASSWORD="super_secret_db_pass"\nexport API_KEY="sk-prod-api-key-12345"\nexport ADMIN_TOKEN="FLAG{imds_token_stolen}"\n',
  };

  const value = metadataTree[path];
  if (value === undefined) return res.status(404).send('Not Found');
  
  res.type('text/plain').send(Array.isArray(value) ? value.join('\n') : value);
});

// IAM Privilege Escalation
router.get('/iam', (req, res) => { res.render('labs/cloud/iam', { title: 'IAM Privilege Escalation', labId: 'cloud-metadata' }); });

router.post('/iam/assume-role', (req, res) => {
  const { roleArn } = req.body;
  if (roleArn && (roleArn.includes('admin') || roleArn.includes('Admin'))) {
    res.json({ success: true, credentials: { AccessKeyId: 'ASIA_ADMIN_KEY', SecretAccessKey: 'admin_secret' }, flag: 'FLAG{imds_token_stolen}', message: 'Escalated to admin role!' });
  } else {
    res.json({ success: true, credentials: { AccessKeyId: 'ASIA_LIMITED_KEY' }, message: 'Role assumed. Try admin roles.' });
  }
});

router.get('/container', (req, res) => { res.render('labs/cloud/container', { title: 'Container Escape', labId: 'cloud-metadata' }); });
router.get('/serverless', (req, res) => { res.render('labs/cloud/serverless', { title: 'Serverless Injection', labId: 'cloud-metadata' }); });

// Serverless function injection
router.post('/serverless/invoke', (req, res) => {
  const { input } = req.body;
  // Simulates eval() in a Lambda function
  if (input && (input.includes('process.env') || input.includes('require') || input.includes('__dirname'))) {
    res.json({ success: true, output: 'FLAG{serverless_injection}', env: { AWS_SECRET: 'exposed!', DB_URL: 'mongodb://admin:pass@db:27017' } });
  } else {
    res.json({ success: true, output: `Processed: ${input}`, hint: 'Try injecting: process.env or require("child_process")' });
  }
});

module.exports = router;
