# Generated by Django 5.1.7 on 2025-03-08 10:04

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('certificates', '0001_initial'),
        ('courses', '0002_alter_usercourse_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='certificate',
            name='is_dynamic',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='certificate',
            name='last_updated',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='certificate',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name='CertificateCourse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('quiz_score', models.FloatField(default=0.0)),
                ('certificate', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certificate_courses', to='certificates.certificate')),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certificate_inclusions', to='courses.course')),
            ],
            options={
                'unique_together': {('certificate', 'course')},
            },
        ),
    ]
