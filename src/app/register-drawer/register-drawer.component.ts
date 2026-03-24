import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface Country {
  code: string;
  flag: string;
  dial: string;
  name: string;
}

/** Validator : motDePasse === confirmMotDePasse */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('motDePasse')?.value;
  const cpw = group.get('confirmMotDePasse')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register-drawer',
  templateUrl: './register-drawer.component.html',
  styleUrls: ['./register-drawer.component.scss']
})
export class RegisterDrawerComponent implements OnInit {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  @ViewChild('dayInput')   dayInput!:   ElementRef<HTMLInputElement>;
  @ViewChild('monthInput') monthInput!: ElementRef<HTMLInputElement>;
  @ViewChild('yearInput')  yearInput!:  ElementRef<HTMLInputElement>;

  userForm!: FormGroup;
  submitted    = false;
  successMessage = '';
  errorMessage   = '';
  showPassword = false;
  showConfirm  = false;
  selectedFlag = '🇫🇷';

  genres: any[] = [];

  private apiUrl = 'http://localhost:5207/api';

  countries: Country[] = [
    { code: 'FR', flag: '🇫🇷', dial: '+33',   name: 'France'              },
    { code: 'MA', flag: '🇲🇦', dial: '+212',  name: 'Maroc'               },
    { code: 'BE', flag: '🇧🇪', dial: '+32',   name: 'Belgique'            },
    { code: 'CH', flag: '🇨🇭', dial: '+41',   name: 'Suisse'              },
    { code: 'DZ', flag: '🇩🇿', dial: '+213',  name: 'Algérie'             },
    { code: 'TN', flag: '🇹🇳', dial: '+216',  name: 'Tunisie'             },
    { code: 'SN', flag: '🇸🇳', dial: '+221',  name: 'Sénégal'             },
    { code: 'CI', flag: '🇨🇮', dial: '+225',  name: "Côte d'Ivoire"       },
    { code: 'CM', flag: '🇨🇲', dial: '+237',  name: 'Cameroun'            },
    { code: 'GB', flag: '🇬🇧', dial: '+44',   name: 'Royaume-Uni'         },
    { code: 'DE', flag: '🇩🇪', dial: '+49',   name: 'Allemagne'           },
    { code: 'ES', flag: '🇪🇸', dial: '+34',   name: 'Espagne'             },
    { code: 'IT', flag: '🇮🇹', dial: '+39',   name: 'Italie'              },
    { code: 'PT', flag: '🇵🇹', dial: '+351',  name: 'Portugal'            },
    { code: 'NL', flag: '🇳🇱', dial: '+31',   name: 'Pays-Bas'            },
    { code: 'SE', flag: '🇸🇪', dial: '+46',   name: 'Suède'               },
    { code: 'NO', flag: '🇳🇴', dial: '+47',   name: 'Norvège'             },
    { code: 'DK', flag: '🇩🇰', dial: '+45',   name: 'Danemark'            },
    { code: 'PL', flag: '🇵🇱', dial: '+48',   name: 'Pologne'             },
    { code: 'RU', flag: '🇷🇺', dial: '+7',    name: 'Russie'              },
    { code: 'US', flag: '🇺🇸', dial: '+1',    name: 'États-Unis'          },
    { code: 'CA', flag: '🇨🇦', dial: '+1',    name: 'Canada'              },
    { code: 'MX', flag: '🇲🇽', dial: '+52',   name: 'Mexique'             },
    { code: 'BR', flag: '🇧🇷', dial: '+55',   name: 'Brésil'              },
    { code: 'AR', flag: '🇦🇷', dial: '+54',   name: 'Argentine'           },
    { code: 'AE', flag: '🇦🇪', dial: '+971',  name: 'Émirats arabes unis' },
    { code: 'SA', flag: '🇸🇦', dial: '+966',  name: 'Arabie saoudite'     },
    { code: 'QA', flag: '🇶🇦', dial: '+974',  name: 'Qatar'               },
    { code: 'EG', flag: '🇪🇬', dial: '+20',   name: 'Égypte'              },
    { code: 'LB', flag: '🇱🇧', dial: '+961',  name: 'Liban'               },
    { code: 'TR', flag: '🇹🇷', dial: '+90',   name: 'Turquie'             },
    { code: 'IN', flag: '🇮🇳', dial: '+91',   name: 'Inde'                },
    { code: 'CN', flag: '🇨🇳', dial: '+86',   name: 'Chine'               },
    { code: 'JP', flag: '🇯🇵', dial: '+81',   name: 'Japon'               },
    { code: 'KR', flag: '🇰🇷', dial: '+82',   name: 'Corée du Sud'        },
    { code: 'AU', flag: '🇦🇺', dial: '+61',   name: 'Australie'           },
    { code: 'NZ', flag: '🇳🇿', dial: '+64',   name: 'Nouvelle-Zélande'    },
    { code: 'ZA', flag: '🇿🇦', dial: '+27',   name: 'Afrique du Sud'      },
    { code: 'NG', flag: '🇳🇬', dial: '+234',  name: 'Nigeria'             },
    { code: 'KE', flag: '🇰🇪', dial: '+254',  name: 'Kenya'               },
    { code: 'GH', flag: '🇬🇭', dial: '+233',  name: 'Ghana'               },
    { code: 'CL', flag: '🇨🇱', dial: '+56',   name: 'Chili'               },
    { code: 'CO', flag: '🇨🇴', dial: '+57',   name: 'Colombie'            },
    { code: 'IL', flag: '🇮🇱', dial: '+972',  name: 'Israël'              },
    { code: 'PK', flag: '🇵🇰', dial: '+92',   name: 'Pakistan'            },
    { code: 'BD', flag: '🇧🇩', dial: '+880',  name: 'Bangladesh'          },
    { code: 'SG', flag: '🇸🇬', dial: '+65',   name: 'Singapour'           },
    { code: 'MY', flag: '🇲🇾', dial: '+60',   name: 'Malaisie'            },
    { code: 'TH', flag: '🇹🇭', dial: '+66',   name: 'Thaïlande'           },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userForm = this.formBuilder.group({
      title:              ['', Validators.required],
      nomComplet:         ['', Validators.required],
      email:              ['', [Validators.required, Validators.email]],
      motDePasse:         ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse:  ['', Validators.required],
      phonePrefix:        ['+33'],
      telephone:          ['', Validators.required],
      dateDay:            [''],
      dateMonth:          [''],
      dateYear:           [''],
      dateNaissance:      ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.loadGenres();
  }

  loadGenres(): void {
    this.http.get<any[]>(`${this.apiUrl}/genres`).subscribe({
      next:  (data)  => { this.genres = data; },
      error: (error) => {
        console.error('Erreur chargement genres:', error);
        this.genres = [
          { id: 1, nom: 'M.'  },
          { id: 2, nom: 'Mme' },
          { id: 3, nom: 'Mx'  },
          { id: 4, nom: 'Dr'  },
        ];
      }
    });
  }

  get f() { return this.userForm.controls; }

  onPrefixChange(): void {
    const dial    = this.userForm.get('phonePrefix')?.value;
    const country = this.countries.find(c => c.dial === dial);
    this.selectedFlag = country ? country.flag : '🌍';
  }

  /**
   * Gestion auto-focus et auto-complétion des champs date.
   * - Chiffre unique saisi (ex: "7") → padStart "07" puis focus suivant
   * - Deux chiffres saisis              → focus suivant automatiquement
   */
  onDateInput(event: Event, field: 'day' | 'month' | 'year'): void {
    const input = event.target as HTMLInputElement;
    // Garder uniquement les chiffres
    input.value = input.value.replace(/\D/g, '');

    const maxLen = field === 'year' ? 4 : 2;

    if (input.value.length >= maxLen) {
      // Pad et sauvegarde dans le formControl
      const padded = field === 'year'
        ? input.value.slice(0, 4)
        : input.value.slice(0, 2).padStart(2, '0');
      input.value = padded;

      const ctrl = field === 'day' ? 'dateDay' : field === 'month' ? 'dateMonth' : 'dateYear';
      this.userForm.patchValue({ [ctrl]: padded });

      // Focus suivant
      if (field === 'day')   { this.monthInput.nativeElement.focus(); this.monthInput.nativeElement.select(); }
      if (field === 'month') { this.yearInput.nativeElement.focus();  this.yearInput.nativeElement.select();  }

      // Si tous remplis → construire dateNaissance
      this.buildDateNaissance();
    } else {
      const ctrl = field === 'day' ? 'dateDay' : field === 'month' ? 'dateMonth' : 'dateYear';
      this.userForm.patchValue({ [ctrl]: input.value });
    }
  }

  private buildDateNaissance(): void {
    const d = String(this.userForm.get('dateDay')?.value   || '');
    const m = String(this.userForm.get('dateMonth')?.value || '');
    const y = String(this.userForm.get('dateYear')?.value  || '');
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      this.userForm.patchValue({ dateNaissance: `${y}-${m}-${d}` });
    }
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
    this.submitted     = false;
    this.errorMessage  = '';
    this.successMessage = '';
    this.showPassword  = false;
    this.showConfirm   = false;
    this.selectedFlag  = '🇫🇷';
    this.userForm.reset({ phonePrefix: '+33' });
  }

  onSubmit(): void {
    this.submitted     = true;
    this.errorMessage  = '';
    this.successMessage = '';

    if (this.userForm.invalid) {
      return;
    }

    const userData = {
      nomComplet:    this.userForm.value.nomComplet,
      email:         this.userForm.value.email,
      motDePasse:    this.userForm.value.motDePasse,
      telephone:     this.userForm.value.phonePrefix + this.userForm.value.telephone,
      genreId:       parseInt(this.userForm.value.title),
      dateNaissance: this.userForm.value.dateNaissance
    };

    this.http.post(`${this.apiUrl}/users`, userData).subscribe({
      next: (response: any) => {
        this.successMessage = "Compte créé avec succès ! Un code d'activation a été envoyé à votre email.";
        setTimeout(() => this.close(), 3000);
      },
      error: (error) => {
        console.error('Erreur API:', error);
        this.errorMessage = 'Une erreur est survenue lors de la création du compte. Veuillez réessayer.';
      }
    });
  }
}