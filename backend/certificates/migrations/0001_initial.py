# Generated by Django 5.0.4 on 2025-03-06 23:10

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('courses', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Certificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('certificate_id', models.CharField(max_length=255, unique=True)),
                ('pdf_url', models.URLField(blank=True, null=True)),
                ('ipfs_hash', models.CharField(blank=True, max_length=255, null=True)),
                ('blockchain_tx', models.CharField(blank=True, max_length=255, null=True)),
                ('nft_token_id', models.CharField(blank=True, max_length=255, null=True)),
                ('is_valid', models.BooleanField(default=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='course_certificates', to='courses.course')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_certificates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CertificateVerification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('verification_id', models.CharField(max_length=255, unique=True)),
                ('verified_by', models.EmailField(blank=True, max_length=254, null=True)),
                ('is_valid', models.BooleanField()),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('certificate', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verifications', to='certificates.certificate')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
