// Coefficients par série
const coefficients = {
  A1:{ "Français":5,"Philosophie":4,"LV1":4,"LV2":3,"Histoire-Géo":3,"Mathématiques":2,"SVT":2,"EPS":1 },
  A2:{ "Français":5,"Philosophie":4,"Histoire-Géo":4,"LV1":3,"LV2":2,"Mathématiques":2,"SVT":2,"EPS":1 },
  B:{ "Français":5,"Philosophie":3,"Économie":4,"Histoire-Géo":3,"LV1":3,"Mathématiques":2,"SVT":2,"EPS":1 },
  C:{ "Mathématiques":6,"Physique-Chimie":5,"SVT":2,"Français":2,"Philosophie":2,"Anglais":2,"Histoire-Géo":2,"EPS":1 },
  D:{ "SVT":5,"Physique-Chimie":4,"Mathématiques":4,"Français":2,"Philosophie":2,"Anglais":2,"Histoire-Géo":2,"EPS":1 },
  E:{ "Mathématiques":6,"Physique-Chimie":5,"Technologie":5,"Français":3,"Philosophie":2,"LV1":2,"EPS":1 },
  EA:{},
  F1:{ "Mécanique":6,"Dessin industriel":5,"Mathématiques":4,"Physique-Chimie":3,"Français":2,"Philosophie":2,"EPS":1 },
  F2:{ "Électronique":6,"Mathématiques":5,"Physique-Chimie":4,"Français":3,"Philosophie":2,"LV1":2,"EPS":1 },
  F3:{ "Électrotechnique":6,"Mathématiques":5,"Physique-Chimie":4,"Français":3,"Philosophie":2,"LV1":2,"EPS":1 },
  F4:{ "Génie civil":6,"Dessin technique":5,"Mathématiques":4,"Physique-Chimie":3,"Français":2,"Philosophie":2,"EPS":1 },
  G1:{ "Administration":5,"Comptabilité":4,"Français":3,"Philosophie":2,"LV1":2,"Mathématiques":2,"EPS":1 },
  G2:{ "Comptabilité":5,"Économie":4,"Mathématiques":4,"Français":3,"Philosophie":2,"LV1":2,"EPS":1 },
  G3:{ "Commerce":5,"Économie":4,"Français":3,"Philosophie":2,"LV1":2,"Mathématiques":2,"EPS":1 },
};

// Sélecteurs
const serie = document.getElementById("serie");
const form = document.getElementById("notesForm");
const matieres = document.getElementById("matieres");
const resultat = document.getElementById("resultat");
const classementDiv = document.getElementById("classements");

serie.addEventListener("change", afficherMatieres);
form.addEventListener("submit", calculer);

// Affiche les champs de notes selon la série sélectionnée
function afficherMatieres(){
  matieres.innerHTML = "";
  const choix = serie.value;
  if(!choix) return;

  // Si la série n'a pas de coefficients configurés
  if(!coefficients[choix] || Object.keys(coefficients[choix]).length === 0){
    matieres.innerHTML = `<p style="color:#e53935;font-weight:bold;">Les matières et coefficients pour la série "${choix}" ne sont pas encore configurés dans cet outil. Merci de contacter l'administrateur.</p>`;
    return;
  }

  Object.entries(coefficients[choix]).forEach(([matiere])=>{
    const div = document.createElement("div");
    div.className = "champ";
    // input avec id égal au nom de la matière (attention aux espaces dans les noms)
    // on garde l'id tel quel pour compatibilité avec le reste du code
    div.innerHTML = `
      <label for="${matiere}">${matiere}</label>
      <input type="number" id="${matiere}" min="0" max="20" step="0.25" required>
    `;

    // Ajouter une case à cocher pour EPS (alignée et non centrée par défaut)
    if(matiere === "EPS"){
      div.innerHTML += `
        <div class="dispense-container" style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <input type="checkbox" id="dispenseEPS">
          <label for="dispenseEPS" style="margin:0;">Dispensé d'EPS</label>
        </div>
      `;
    }

    matieres.appendChild(div);

    // Gestion dynamique du champ EPS (après insertion dans le DOM)
    if(matiere === "EPS"){
      const epsInput = document.getElementById("EPS");
      const dispenseBox = document.getElementById("dispenseEPS");

      // Si pour une raison epsInput ou dispenseBox est null, on ignore
      if(epsInput && dispenseBox){
        // Initialisation : si la case est cochée par défaut (rare), désactiver le champ
        if(dispenseBox.checked){
          epsInput.removeAttribute("required");
          epsInput.disabled = true;
          epsInput.value = "";
        } else {
          epsInput.setAttribute("required","true");
          epsInput.disabled = false;
        }

        dispenseBox.addEventListener("change", ()=>{
          if(dispenseBox.checked){
            epsInput.removeAttribute("required");
            epsInput.disabled = true;
            epsInput.value = "";
          } else {
            epsInput.setAttribute("required","true");
            epsInput.disabled = false;
          }
        });
      }
    }
  });
}

// Calcul de la moyenne et génération des classements (accordéon)
function calculer(e){
  e.preventDefault();

  // Vérifier validité du formulaire (les champs requis doivent être remplis)
  if(!form.checkValidity()){
    form.reportValidity();
    return;
  }

  const choix = serie.value;

  // Garde-fou : série sans barème de coefficients configuré
  if(!coefficients[choix] || Object.keys(coefficients[choix]).length === 0){
    resultat.innerHTML = `<p style="color:#e53935;">Impossible de calculer : la série "${choix}" n'est pas encore configurée.</p>`;
    classementDiv.innerHTML = "";
    return;
  }

  let total = 0, coeffTotal = 0;
  const notes = {};

  // Moyenne générale : on ignore les matières désactivées (ex: EPS dispensé)
  Object.entries(coefficients[choix]).forEach(([matiere, coef])=>{
    const input = document.getElementById(matiere);
    if(!input) return; // sécurité

    // Si le champ est désactivé (dispensé), on l'ignore
    if(input.disabled) return;

    const note = parseFloat(input.value);
    if(!isNaN(note)){
      notes[matiere] = note;
      total += note * coef;
      coeffTotal += coef;
    }
  });

  const moyenne = coeffTotal > 0 ? (total / coeffTotal).toFixed(2) : "-";
  resultat.innerHTML = `<h2>Moyenne générale : ${moyenne}/20</h2>`;

  // Nettoyer la zone des classements
  classementDiv.innerHTML = "";

  // --- Générer un tableau par université avec accordéon ---
  // On suppose que la variable `ecoles` est définie plus bas dans le fichier (ou avant l'appel)
  if(typeof ecoles === "undefined"){
    // Si ecoles n'est pas défini, on affiche un message d'erreur clair
    classementDiv.innerHTML = `<p style="color:#e53935;">Les données des établissements ne sont pas disponibles.</p>`;
    return;
  }

  Object.entries(ecoles).forEach(([universite, etablissements])=>{
    // Créer l'item accordéon
    const accordionItem = document.createElement("div");
    accordionItem.className = "accordion-item";

    // Header (bouton)
    const header = document.createElement("button");
    header.className = "accordion-header";
    header.type = "button";
    header.textContent = universite;

    // Content
    const content = document.createElement("div");
    content.className = "accordion-content";

    // Tableau pour cette université
    const tableau = document.createElement("table");
    tableau.className = "resultats";
    tableau.innerHTML = `
      <tr>
        <th>Établissement</th>
        <th>Filière</th>
        <th>Quotas</th>
        <th>Bac</th>
        <th>Moyenne</th>
        <th>Matières</th>
        <th>Débouchés</th>
      </tr>
    `;

    let resultats = [];

    Object.entries(etablissements).forEach(([etablissement, filieres])=>{
      filieres.forEach(filiere=>{
        // Vérifier compatibilité du bac recommandé
        if(!filiere.bacRecommande || !filiere.bacRecommande.some(bac=>{
          if(bac === "A") return choix === "A1" || choix === "A2";
          if(bac === "F") return choix.startsWith("F");
          if(bac === "DT/STI") return choix.startsWith("F") || choix.startsWith("G") || choix === "E";
          return bac === choix;
        })) return;

        let totalClassement = 0, sommeCoeff = 0;
        const matieresFiliere = filiere.matieresParSerie && (filiere.matieresParSerie[choix] || filiere.matieresParSerie["default"]) || [];

        matieresFiliere.forEach(matiere=>{
          // Si la note existe et la matière n'est pas désactivée
          const input = document.getElementById(matiere);
          if(input && input.disabled) return; // dispensé pour cette matière
          if(notes[matiere] !== undefined){
            const coefSerie = (coefficients[choix] && coefficients[choix][matiere]) || 1;
            totalClassement += notes[matiere] * coefSerie;
            sommeCoeff += coefSerie;
          }
        });

        const moyenneClassement = sommeCoeff > 0 ? (totalClassement / sommeCoeff).toFixed(2) : "-";

        resultats.push({
          etablissement,
          filiere: filiere.filiere || "",
          quotas: filiere.quotas || "",
          bac: (filiere.bacRecommande || []).join(", "),
          moyenne: moyenneClassement,
          matieres: matieresFiliere.join(", "),
          debouches: (filiere.debouches || []).join("<br>")
        });
      });
    });

    // Trier par moyenne décroissante (les "-" seront traités comme -Infinity)
    resultats.sort((a,b)=>{
      const na = a.moyenne === "-" ? -Infinity : parseFloat(a.moyenne);
      const nb = b.moyenne === "-" ? -Infinity : parseFloat(b.moyenne);
      return nb - na;
    });

    // Ajouter les lignes triées
    resultats.forEach(r=>{
      tableau.innerHTML += `
        <tr>
          <td>${r.etablissement}</td>
          <td>${r.filiere}</td>
          <td>${r.quotas}</td>
          <td>${r.bac}</td>
          <td><strong>${r.moyenne === "-" ? "-" : r.moyenne + "/20"}</strong></td>
          <td>${r.matieres}</td>
          <td>${r.debouches}</td>
        </tr>
      `;
    });

    // Si aucun résultat pour cette université, afficher un message
    if(resultats.length === 0){
      content.innerHTML = `<p style="margin:0;">Aucun résultat correspondant à votre série/notes.</p>`;
    } else {
      content.appendChild(tableau);
    }

    // Assemblage de l'accordéon
    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    classementDiv.appendChild(accordionItem);
  });

  // --- Gestion du clic pour l'accordéon (un seul ouvert à la fois) ---
  // On attache un seul listener au document (délégué) pour gérer les headers dynamiques
  // (si déjà attaché, on évite d'attacher plusieurs fois)
  if(!document._accordionListenerAttached){
    document.addEventListener("click", function(e){
      if(e.target.classList.contains("accordion-header")){
        const currentItem = e.target.parentElement;
        const allItems = document.querySelectorAll(".accordion-item");

        // Fermer tous les autres
        allItems.forEach(item=>{
          if(item !== currentItem){
            item.classList.remove("active");
          }
        });

        // Basculer l'état du courant
        currentItem.classList.toggle("active");

        // Optionnel : faire défiler légèrement pour que le header soit visible sur mobile
        if(currentItem.classList.contains("active")){
          setTimeout(()=> {
            currentItem.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        }
      }
    });
    document._accordionListenerAttached = true;
  }
}

// ---------------------------
// Exemple (ou suite) : structure des écoles
// (Assure-toi que la variable `ecoles` est définie dans le même fichier,
//  ou avant l'appel à `calculer`.)
// ---------------------------

const ecoles = {
  "Université d’Abomey-Calavi": {
    "Institut Régional de Santé Publique (IRSP)": [{
      filiere: "Santé Publique polyvalente",
      quotas: "Bourse: 16  Aide: 7",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique-Chimie", "SVT"]
      },
      debouches: ["Agent de santé communautaire", "Responsable de surveillance épidémiologique", "Attaché de recherche en santé", "Assistant en planification, suivi et évaluation en santé", "Agent d’hygiène et d’assainissement du milieu"]
    }],
    "FLASH": [{
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 69  Aide: 446",
      modeEntree: "Classement",
      bacRecommande: ["A", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géo", "Mathématiques"]
      },
      debouches: ["Enseignement", "Laboratoires", "Assainissement"]
    }, {
      filiere: "Socio-Anthropologie",
      quotas: "Bourse: 69  Aide: 446",
      modeEntree: "Classement",
      bacRecommande: ["A", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géo", "Mathématiques"]
      },
      debouches: ["Centres sociaux", "Ministères", "Institutions de recherche"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 157  Aide: 891",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Interprétariat", "Tourisme", "Enseignement"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 12  Aide: 75",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand (LV1)", "Anglais", "Histoire-Géo"]
      },
      debouches: ["Professeur de lycée", "Interprète", "Traducteur"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 60  Aide: 311",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol (LV1)", "Anglais", "Histoire-Géo"]
      },
      debouches: ["Professeur de lycée", "Interprète", "Traducteur"]
    }, {
      filiere: "Lettres Modernes",
      quotas: "Bourse: 100  Aide: 75",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignement"]
    }, {
      filiere: "Sciences Religieuses et Relations Internationales",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Philosophie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Anglais (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire"]
    }, {
      filiere: "Sociologie Anthropologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur en sciences sociales"]
    }, {
      filiere: "Lettres Modernes",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }],
    "INMAAC": [{
      filiere: "Arts dramatiques",
      quotas: "Bourse: 8  Aide: 60",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Comédien", "Danseur", "Musicien"]
    }, {
      filiere: "Arts plastiques",
      quotas: "Bourse: 8  Aide: 60",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Arts plastiques"]
      },
      debouches: ["Peintre", "Sculpteur", "Designer", "Photographe", "Art appliqué"]
    }, {
      filiere: "Musique et Musicologie",
      quotas: "Bourse: 0  Aide: -",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Chanteur", "Compositeur", "Chef d’orchestre", "Opérateur de son", "Mixeur", "Arrangeur"]
    }, {
      filiere: "Cinéma et Audiovisuel",
      quotas: "Bourse: 0  Aide: -",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Scénariste", "Réalisateur", "Spécialiste en audiovisuel", "Monteur", "Graphiste"]
    }],
    "CIFRED": [{
      filiere: "Aménagement, réadaptation, sauvegarde environnementale et gestion/restauration de l’environnement",
      quotas: "Bourse: 56  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Inspecteur d’action militaire", "Ingénieur en environnement"]
    }],
    "IGATE": [{
      filiere: "Gestion du cadre de vie",
      quotas: "Bourse: 56  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Aménagement", "Réadaptation", "Sauvegarde environnementale", "Gestion et restauration de l’environnement"]
    }, {
      filiere: "Gestion des Environnements et des Ecosystèmes",
      quotas: "Bourse: 35  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Changement climatique", "Aménagement et gestion des ressources naturelles"]
    }, {
      filiere: "Géomatique et Environnement",
      quotas: "Bourse: 35  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Spécialiste en cartographie"]
    }],
    "INE": [{
      filiere: "Sciences Infirmières",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Spécialisation en planification et gestion des espaces urbains"]
    }, {
      filiere: "Sciences Obstétricales",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Soins infirmiers dans les hôpitaux et centres de santé"]
    }, {
      filiere: "Hydrologie et Hydrogéologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Hydrologue", "Hydrogéologue"]
    }, {
      filiere: "Environnement et Hygiène",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Contrôle d’eau", "Travaux d’assainissement et bases"]
    }, {
      filiere: "Gestion des Eaux et Climat",
      quotas: "Bourse: 27  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Hydrologues", "Hydrogéologues", "Agents des eaux et forêts", "Contrôle de la qualité physico-chimique de base"]
    }, {
      filiere: "Génie rural et maîtrise d’eau (GMRE)",
      quotas: "Bourse: 19  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Aménagements hydro-agricoles", "Contrôleur des ouvrages d’assainissement hydro-agricoles"]
    }, {
      filiere: "Hydraulique et Assainissement (HA)",
      quotas: "Bourse: 55  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Hydraulicien", "Ingénieur en génie sanitaire"]
    }, {
      filiere: "Eau Hygiène et Assainissement (EHA)",
      quotas: "Bourse: 54  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Contrôleur des ouvrages d’assainissement hydro-agricoles", "Ingénieur en génie sanitaire"]
    }],
    "ENEAM": [{
      filiere: "Administration des Réseaux Informatiques",
      quotas: "Bourse: 50  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "DT/MI"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Technicien en réseaux informatiques"]
    }, {
      filiere: "Analyse Informatique et Programmation",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "DT/MI"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Développeur d’applications Desktop", "Développeur Web", "Développeur Mobile"]
    }, {
      filiere: "Assurance",
      quotas: "Bourse: 7  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "Q2", "Q3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Chargés de clientèle"]
    }, {
      filiere: "Banque et Finance de Marché",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "Q2", "Q3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Gestionnaires de patrimoine", "Gestionnaires de portefeuille"]
    }],
    "Banque d’Instructions des Micro Finances": [{
      filiere: "Banque et Assurance",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Étude de cas", "Anglais"]
      },
      debouches: ["Chargé de clientèle", "Gestionnaire de patrimoine et de portefeuilles"]
    }],
    "ENAM": [{
      filiere: "Marketing",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["B", "C", "D", "G3", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Étude de cas", "Anglais"]
      },
      debouches: ["Chargé d’étude développement commercial", "Chef de produit", "Chargé d’étude marketing", "Chef de publicité", "Chargé de communication", "Chef de projet communication", "Responsable de communication", "Responsable marketing digital", "Responsable de stratégie digitale", "Responsable de marque", "Responsable de développement digital brand", "Community manager", "Data analyst", "Digital project manager", "Responsable e-commerce", "Digital planner", "Consultant en marketing digital (SEM/SEO)", "Chef de produit digital", "Responsable de développement numérique", "Chef de projet web", "Marketing manager", "Chef de vente", "Responsable commercial", "Chargé d’affaires", "Responsable des ressources humaines"]
    }, {
      filiere: "Planification Gestion et Administration des Projets",
      quotas: "Bourse: 23  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire de projets", "Chargé d’études", "Conseiller en planification"]
    }, {
      filiere: "Développement Local et Régional",
      quotas: "Bourse: 41  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chargé de développement local", "Consultant en aménagement régional"]
    }, {
      filiere: "Administration Générale",
      quotas: "Bourse: 70  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3", "A1", "A2", "D1", "C", "D", "E"],
      matieresParSerie: {
        "default": ["Français", "Mathématiques", "Histoire-Géographie", "Philosophie", "Anglais", "Économie"]
      },
      debouches: ["Attaché des affaires étrangères", "Inspecteur du Travail et de la Sécurité Sociale"]
    }, {
      filiere: "Administration des Services Financiers",
      quotas: "Bourse: 69  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "G2", "G3", "A1", "A2", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Attaché des services financiers", "Attaché des services administratifs (Centres Hospitaliers)"]
    }, {
      filiere: "Secrétariat de Gestion",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Secrétaire de direction", "Secrétaire administratif", "Assistant de gestion"]
    }, {
      filiere: "Sciences Techniques et Documentaires",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Technicien supérieur en archivistique", "Technicien supérieur documentaliste"]
    }, {
      filiere: "Administration Générale",
      quotas: "Bourse: 70  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3", "A1", "A2", "D1", "C", "D", "E"],
      matieresParSerie: {
        "default": ["Français", "Mathématiques", "Histoire-Géographie", "Philosophie", "Anglais", "Économie"]
      },
      debouches: ["Attaché des affaires étrangères", "Inspecteur du Travail et de la Sécurité Sociale"]
    }, {
      filiere: "Administration des Services Financiers",
      quotas: "Bourse: 69  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "G2", "G3", "A1", "A2", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Attaché des services financiers", "Attaché des services administratifs (Centres Hospitaliers)"]
    }, {
      filiere: "Secrétariat de Gestion",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Secrétaire de direction", "Secrétaire administratif", "Assistant de gestion"]
    }, {
      filiere: "Sciences Techniques et Documentaires",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Technicien supérieur en archivistique", "Technicien supérieur documentaliste"]
    }, {
      filiere: "Entrepreneuriat social",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Technicien Supérieur d’Action Sociale Éducative", "Spécialiste en création et gestion d’entreprise"]
    }, {
      filiere: "Histoire et Géographie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en sciences humaines"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Français",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en lettres modernes"]
    }, {
      filiere: "Philosophie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en philosophie"]
    }, {
      filiere: "Droit",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Juriste", "Magistrat", "Diplomate"]
    }, {
      filiere: "Sciences Religieuses",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Spécialiste en gestion du patrimoine religieux", "Chercheur en sciences religieuses"]
    }],
    "FASEG": [{
      filiere: "Gestion Financière et Comptable",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Comptable", "Financier", "Auditeur interne"]
    }, {
      filiere: "Sciences Économiques et de Gestion (Monnaie et Finance)",
      quotas: "Bourse: 407  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Services déconcentrés de l’État", "Collectivités locales", "Banques et ONG", "Comptabilité", "Audits financiers", "Assurance", "Professions économiques et financières", "Enseignement supérieur et recherche", "Services d’études et de statistiques", "Gestion des marchés", "Gestion des entreprises industrielles et productives"]
    }, {
      filiere: "Économétrie et Statistique Appliquée",
      quotas: "Bourse: 207  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Statistique", "Économétrie", "Analyse économique", "Gestion publique", "Analyse des politiques économiques", "Planification", "Évaluation des projets", "Études économiques et financières", "Gestion des ressources humaines", "Gestion des entreprises", "Audit financier", "Banque", "Assurance"]
    }, {
      filiere: "Sciences et Techniques Financières et Comptables (STFC)",
      quotas: "Bourse: 18  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Audit comptable et financier", "Gestion comptable en entreprise", "Agent comptable", "Gestionnaire"]
    }, {
      filiere: "Économie et Gestion des Ressources Humaines (EGRH)",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Gestion des RH", "Administration", "Management", "Audit social", "Conseil en organisation", "Gestion des carrières", "Formation", "Communication interne", "Gestion des conflits", "Relations sociales", "Gestion du personnel"]
    }, {
      filiere: "Gestion des Entreprises",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire d’entreprise", "Consultant en management", "Chef de projet"]
    }, {
      filiere: "Gestion des Ressources Humaines",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Responsable RH", "Consultant en organisation", "Chargé de formation"]
    }, {
      filiere: "Gestion Commerciale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Chargé de clientèle", "Responsable commercial", "Consultant en marketing"]
    }],
    "EPA": [{
      filiere: "Gestion du patrimoine culturel",
      quotas: "Bourse: 39  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire du patrimoine", "Conservateur de musée"]
    }, {
      filiere: "Histoire et Archéologie",
      quotas: "Bourse: 82  Aide: 657",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignant", "Chercheur", "Responsable d’établissement"]
    }],
    "FASHS": [{
      filiere: "Psychologie",
      quotas: "Bourse: 44  Aide: 252",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Formation des enseignants", "Psychologues", "Conseillers"]
    }, {
      filiere: "Sciences de l’Éducation et de la Formation",
      quotas: "Bourse: 52  Aide: 52",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignement dans les collèges et lycées"]
    }, {
      filiere: "Philosophie",
      quotas: "Bourse: 175  Aide: 176",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignement", "Recherche"]
    }, {
      filiere: "Sociologie-Anthropologie",
      quotas: "Bourse: 649  Aide: 649",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chercheur", "Consultant en sciences sociales"]
    }, {
      filiere: "Géographie culturelle et économique",
      quotas: "Bourse: 20  Aide: 20",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chercheur en géographie", "Consultant en aménagement"]
    }],
    "ENSTIC": [{
      filiere: "Journalisme et Communication",
      quotas: "Bourse: 16  Aide: 16",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Journaliste", "Spécialiste en communication"]
    }, {
      filiere: "Communication audiovisuelle et multimédia",
      quotas: "Bourse: 20  Aide: 20",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Spécialiste multimédia", "Gestionnaire de production et reproduction"]
    }],
    "IFRI": [{
      filiere: "Génie logiciel",
      quotas: "Bourse: 71  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Analystes et concepteurs", "Administrateurs de bases de données", "Administrateurs réseaux et systèmes", "Développeurs d’applications métiers", "Développeurs d’applications web"]
    }, {
      filiere: "Internet et Multimédia",
      quotas: "Bourse: 14  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Concepteurs d’applications mobiles", "Graphistes et designers numériques", "Monteurs sons et TV", "Web radio"]
    }, {
      filiere: "Génie logiciel",
      quotas: "Bourse: 71  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Analystes et concepteurs", "Administrateurs de bases de données", "Administrateurs réseaux et systèmes", "Développeurs d’applications métiers", "Développeurs d’applications web"]
    }, {
      filiere: "Internet et Multimédia",
      quotas: "Bourse: 14  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Concepteurs d’applications mobiles", "Graphistes et designers numériques", "Monteurs sons et TV", "Web radio"]
    }, {
      filiere: "Intelligence Artificielle (IA)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Développeurs de solutions intelligentes", "Spécialistes en IA appliquée"]
    }, {
      filiere: "Systèmes Numériques et Cyberphysiques (SNC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Concepteurs de solutions domotiques", "Ingénieurs en systèmes embarqués"]
    }, {
      filiere: "Sécurité Informatique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Expert en cybersécurité", "Administrateur sécurité des systèmes"]
    }],
    "FSA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en production végétale", "Chercheur en agronomie"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en conduite des élevages", "Chercheur en zootechnie"]
    }, {
      filiere: "Aménagement et Gestion des Ressources Naturelles",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire des forêts et des parcs naturels", "Consultant en ressources naturelles"]
    }, {
      filiere: "Génie Rural, Foresterie, Pêche et Aquaculture",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Ingénieur rural", "Spécialiste en foresterie", "Technicien supérieur en pêche et aquaculture"]
    }, {
      filiere: "Nutrition et Technologie Alimentaires",
      quotas: "Bourse: 47  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Technicien en diététique", "Centres de santé", "Industries agroalimentaires"]
    }, {
      filiere: "Agronomie, Environnement et Santé",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Entreprise agricole", "Ferme agricole", "Enseignement et vulgarisation", "Centres de recherche", "Laboratoires"]
    }, {
      filiere: "Entrepreneuriat Agricole",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Gestionnaire de ferme"]
    }, {
      filiere: "Médecine Générale",
      quotas: "Bourse: 150  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en sciences de la santé"]
    }, {
      filiere: "Génie de l’Environnement",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Aménagement et protection de l’environnement", "Consultant en gestion environnementale"]
    }, {
      filiere: "Génie Civil",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur civil", "Spécialiste en construction"]
    }, {
      filiere: "Génie Électrique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur électricien", "Spécialiste en réseaux électriques"]
    }, {
      filiere: "Génie Mécanique et Énergétique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Fabrication mécanique", "Ingénieur en énergie"]
    }, {
      filiere: "Génie Informatique et Télécom",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur en télécommunications", "Développeur systèmes informatiques"]
    }, {
      filiere: "Génie Chimique procédés",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur chimiste", "Spécialiste en procédés industriels"]
    }, {
      filiere: "Hydrobiologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Sur C.E.",
      bacRecommande: ["D", "E"],
      matieresParSerie: {
        "default": ["Biologie", "SVT"]
      },
      debouches: ["Technicien de laboratoire de biologie", "Technicien d’aquaculture", "Technicien d’élevage", "Technicien d’aménagement des zones humides", "Technicien en inspection des produits halieutiques"]
    }],
    "FSS": [{
      filiere: "Pharmacie",
      quotas: "Bourse: 16  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Pharmacien", "Spécialisation en sciences de la santé (option pharmacie)"]
    }, {
      filiere: "Kinésithérapie",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Spécialisation en sciences de la santé (option kinésithérapie)"]
    }, {
      filiere: "Assistance sociale",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "D"],
      matieresParSerie: {
        "default": ["Philosophie", "Histoire-Géographie"]
      },
      debouches: ["Technicien supérieur de l’action sociale"]
    }, {
      filiere: "Nutrition et Diététique",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Nutritionniste dans les hôpitaux", "Nutritionniste dans institutions spécialisées"]
    }, {
      filiere: "Analyse biomédicale",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Technicien de laboratoire d’analyses biomédicales", "Assistant de recherche"]
    }],
    "ETANA": [{
      filiere: "Production et Santé Animales",
      quotas: "Bourse: 37  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Médecin vétérinaire", "Technicien supérieur des fermes (UBETA)", "Inspecteur des services vétérinaires", "Enseignant dans les lycées, fermes et collèges agricoles", "Chercheur en production et santé animale", "Chercheur en halieutiques"]
    }],
    "FSA - Spécialisations": [{
      filiere: "Machinisme agricole",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en machinisme agricole", "Ingénieur en équipements agricoles"]
    }, {
      filiere: "Génie Biomédical",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Laboratoire de biologie", "Technicien biomédical"]
    }, {
      filiere: "Dynamique de Population et Planification Régionale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Spécialiste du développement local", "Consultant en planification régionale"]
    }, {
      filiere: "Négocié International",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Négociateur international", "Consultant en commerce extérieur"]
    }, {
      filiere: "Gestion des Relations Internationales",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Diplomate", "Consultant en relations internationales"]
    }, {
      filiere: "Commerce International",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Spécialiste en commerce international", "Gestionnaire d’import-export"]
    }],
    "INJEPS": [{
      filiere: "Éducation Physique et Sportive",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur EPS (CAP/CEAP)", "Cadre d’Appui au Personnel Adjoint de Sport (CAPAS)"]
    }, {
      filiere: "Entraînement Sportif",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Entraîneur sportif", "Conseiller en performance physique"]
    }, {
      filiere: "Andragogie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Formateur pour adultes", "Spécialiste en éducation non formelle"]
    }, {
      filiere: "Récréologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Animateur socio-culturel", "Spécialiste en loisirs éducatifs"]
    }],
    "FAST": [{
      filiere: "Sciences de la Vie et de la Terre",
      quotas: "Bourse: 65  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Enseignement des SVT", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Physique-Chimie",
      quotas: "Bourse: 754  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Enseignement de la Physique-Chimie", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Mathématiques et Applications",
      quotas: "Bourse: 717  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Enseignement des Mathématiques", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Énergies Renouvelables",
      quotas: "Bourse: 27  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Production et fourniture d’énergie électrique", "Recherche en énergétique et technologie appliquée", "Audit énergétique", "Ingénierie des systèmes énergétiques"]
    }, {
      filiere: "Génétique et Biotechnologie",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Recherche génétique et biotechnologie appliquée", "Production dans les industries alimentaires et pharmaceutiques", "Contrôle de qualité alimentaire", "Recherche agronomique", "Recherche vétérinaire et animale"]
    }, {
      filiere: "Microbiologie et Biotechnologie Alimentaire",
      quotas: "Bourse: 17  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Production dans les industries alimentaires", "Contrôle de qualité alimentaire", "Recherche agronomique", "Recherche vétérinaire et animale"]
    }, {
      filiere: "Aquaculture",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Sur C.E.",
      bacRecommande: ["D", "E"],
      matieresParSerie: {
        "default": ["Biologie", "SVT"]
      },
      debouches: ["Technicien d’aquaculture", "Technicien d’élevage", "Technicien d’aménagement des zones humides", "Technicien en inspection des produits halieutiques"]
    }],
    "Institut Confucius": [{
      filiere: "Langue Chinoise",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Classement sur test",
      bacRecommande: ["Tous"],
      matieresParSerie: {
        "default": ["Trois matières écrites"]
      },
      debouches: ["Entreprise chinoise au Bénin ou dans la sous-région", "Bourses d’études pour universités chinoises"]
    }, {
      filiere: "Didactique du Chinois",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Enseignement", "Traducteur", "Interprète", "Bourses d’études pour universités chinoises"]
    }],
    "ILACI": [{
      filiere: "Langue Arabe",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Tourisme (touristes arabes)", "Administration publique", "Rédacteur publicitaire"]
    }, {
      filiere: "Culture Islamique",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Administration publique", "Enseignement", "Prédication religieuse"]
    }],
    "FA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Enseignant", "Technicien", "Chercheur"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Technicien supérieur en zootechnie", "Chercheur en production animale"]
    }, {
      filiere: "Agroéconomie et Sociologie Rurale",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Consultant en développement rural", "Chercheur en agroéconomie", "Gestionnaire de projets agricoles"]
    }, {
      filiere: "Nutrition et Sciences des Aliments",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Nutritionniste", "Chercheur en sciences alimentaires", "Technicien supérieur en industries agroalimentaires"]
    }, {
      filiere: "Médecine Humaine",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en médecine"]
    }],
    "IUFISO": [{
      filiere: "Soins Infirmiers",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Biologie", "Français"]
      },
      debouches: ["Infirmier diplômé d’État"]
    }, {
      filiere: "Soins Obstétricaux",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Biologie", "Français"]
      },
      debouches: ["Sage-femme", "Technicien supérieur en obstétrique"]
    }],
    "ENSPAE": [{
      filiere: "Gestion Commerciale",
      quotas: "Bourse: 44  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire commercial", "Chargé de clientèle"]
    }, {
      filiere: "Gestion de l’Entreprise",
      quotas: "Bourse: 59  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire d’entreprise", "Consultant en management"]
    }, {
      filiere: "Gestion des Ressources Humaines",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Responsable RH", "Consultant en organisation"]
    }, {
      filiere: "Informatique de Gestion",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Informatique", "Français"]
      },
      debouches: ["Analyste en informatique de gestion", "Développeur d’applications de gestion"]
    }, {
      filiere: "Gestion de Ressources Logistiques",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire logistique", "Responsable des approvisionnements"]
    }, {
      filiere: "Statistiques Appliquées",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Statistiques", "Économie", "Français"]
      },
      debouches: ["Statisticien", "Analyste de données", "Chargé d’études"]
    }],
    "ENSPD": [{
      filiere: "Économie et Finance des Collectivités Locales (EFL)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Spécialiste en finances locales", "Consultant en gestion des collectivités", "Chargé d’études économiques"]
    }, {
      filiere: "Économie Appliquée (EA)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Analyste économique", "Chargé de planification", "Consultant en politiques publiques"]
    }, {
      filiere: "Audit et Ingénierie Financière des Organisations (AIFO)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Auditeur financier", "Consultant en ingénierie financière", "Gestionnaire de risques"]
    }, {
      filiere: "Finance et Comptabilité (FC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Comptable", "Contrôleur de gestion", "Responsable financier"]
    }],
    "FDSP": [{
      filiere: "Droit Privé",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Greffier", "Huissier", "Avocat", "Notaire", "Administrateur de biens", "Juriste d’entreprise"]
    }, {
      filiere: "Droit Public",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Greffier", "Huissier", "Avocat", "Notaire", "Administrateur de biens", "Juriste d’entreprise"]
    }]
  },
  "Université de Parakou": {
    "FA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Enseignant", "Technicien", "Chercheur"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Technicien supérieur en zootechnie", "Chercheur en production animale"]
    }, {
      filiere: "Agroéconomie et Sociologie Rurale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Consultant en développement rural", "Chercheur en agroéconomie", "Gestionnaire de projets agricoles"]
    }, {
      filiere: "Nutrition et Sciences des Aliments",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Nutritionniste", "Chercheur en sciences alimentaires", "Technicien supérieur en industries agroalimentaires"]
    }, {
      filiere: "Médecine Humaine",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en médecine"]
    }],
    "ENSPAE": [{
      filiere: "Gestion des Banques",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire bancaire", "Chargé de clientèle", "Analyste financier"]
    }, {
      filiere: "Informatique de Gestion",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Informatique", "Français"]
      },
      debouches: ["Analyste en informatique de gestion", "Développeur d’applications de gestion"]
    }, {
      filiere: "Statistique Appliquée",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Statistiques", "Économie", "Français"]
      },
      debouches: ["Statisticien", "Analyste de données", "Chargé d’études"]
    }],
    "FASEG": [{
      filiere: "Économie et Finance Internationale (EFI)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Consultant en gestion", "Chargé d’études", "Chef de projet", "Analyste financier"]
    }, {
      filiere: "Entrepreneuriat et Gestion des Entreprises (EGE)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Créateur d’entreprise", "Gestionnaire", "Consultant en management"]
    }, {
      filiere: "Marketing et Management des Organisations (MMO)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Responsable marketing", "Chef de produit", "Consultant en communication", "Chargé d’études marketing"]
    }, {
      filiere: "Finance et Comptabilité (FC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Comptable", "Contrôleur de gestion", "Responsable financier"]
    }],
    "FLASH": [{
      filiere: "Lettres Modernes",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Philosophie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Langues Vivantes (Allemand, Anglais, Espagnol)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Langue vivante choisie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire"]
    }, {
      filiere: "Sociologie Anthropologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur en sciences sociales"]
    }, {
      filiere: "Allemand",
      niveau: "Licence",
      specialisation: "Allemand (VU)",
      quotas: "Bourse: 129  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Anglais",
      niveau: "Licence",
      specialisation: "Anglais (VU)",
      quotas: "Bourse: 156  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Anglais"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Espagnol",
      niveau: "Licence",
      specialisation: "Espagnol (VU)",
      quotas: "Bourse: 244  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Français",
      niveau: "Licence",
      specialisation: "Français (VU)",
      quotas: "Bourse: 431  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Lettres Modernes",
      niveau: "Licence",
      specialisation: "Lettres Modernes (VU)",
      quotas: "Bourse: 101  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      niveau: "Licence",
      specialisation: "Géographie et Aménagement du Territoire (VU)",
      quotas: "Bourse: 115  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }, {
      filiere: "Sociologie et Anthropologie",
      niveau: "Licence",
      specialisation: "Sociologie et Anthropologie (VU)",
      quotas: "Bourse: 210  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }, {
      filiere: "Histoire-Géo",
      niveau: "Licence",
      specialisation: "Histoire-Géo (VU)",
      quotas: "Bourse: 444  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Histoire-Géographie"]
      },
      debouches: ["Enseignant", "Chercheur", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }],
    "FDSP": [{
      filiere: "Droit privé",
      niveau: "Licence",
      specialisation: "Finances publiques / Fiscalité de base",
      quotas: "Bourse: 545  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Avocat", "Magistrat", "Juriste d’affaires", "Greffier", "Conseiller juridique", "Chargé d’études juridiques et fiscales"]
    }, {
      filiere: "Droit public",
      niveau: "Licence",
      specialisation: "Finances publiques / Fiscalité de base",
      quotas: "Bourse: 341  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Avocat", "Magistrat", "Juriste d’affaires", "Greffier", "Conseiller juridique", "Chargé d’études juridiques et fiscales"]
    }]
  },
  "Université Nationale des Sciences, Technologie, Ingénierie et Mathématiques": {
    "Filières Techniques": [{
      filiere: "Comptabilité",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Comptable", "Gestionnaire financier"]
    }, {
      filiere: "Économie",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Économiste", "Chargé d’études"]
    }, {
      filiere: "Électrotechnique",
      modeEntree: "Classement",
      bacRecommande: ["E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Technicien supérieur en électrotechnique", "Ingénieur en systèmes électriques"]
    }, {
      filiere: "Secrétariat",
      modeEntree: "Classement",
      bacRecommande: ["G1"],
      matieresParSerie: {
        "default": ["Culture Générale", "Français", "Anglais"]
      },
      debouches: ["Secrétaire administratif", "Assistant de direction"]
    }, {
      filiere: "Mécanique Automobile",
      modeEntree: "Classement",
      bacRecommande: ["F1", "F2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en mécanique automobile", "Spécialiste en maintenance"]
    }, {
      filiere: "Fabrication Mécanique",
      modeEntree: "Classement",
      bacRecommande: ["F1", "F2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en fabrication mécanique", "Spécialiste en procédés industriels"]
    }, {
      filiere: "Économie et Gestion",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Gestionnaire", "Consultant en organisation"]
    }, {
      filiere: "Hôtellerie-Restauration",
      modeEntree: "Classement",
      bacRecommande: ["F4", "G1"],
      matieresParSerie: {
        "default": ["Culture Générale", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire hôtelier", "Spécialiste en restauration"]
    }, {
      filiere: "Froid et Climatisation",
      modeEntree: "Classement",
      bacRecommande: ["F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en froid et climatisation", "Spécialiste en maintenance énergétique"]
    }, {
      filiere: "Électronique",
      modeEntree: "Classement",
      bacRecommande: ["E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Technicien supérieur en électronique", "Études en électronique"]
    }],
    "INSTIT": [{
      filiere: "Génie Civil",
      quotas: "Bourse: 68  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais", "Chimie", "SVT"]
      },
      debouches: ["Technicien de Travaux du Génie Civil", "Conducteur de chantiers", "Architecte", "Ingénieur immobilier", "Spécialiste des matériaux"]
    }, {
      filiere: "Génie Énergétique",
      quotas: "Bourse: 37  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Technicien en industrie électrique", "Technicien en électrotechnique", "Technicien en électronique", "Maintenance industrielle", "Instrumentation", "Télécommunication", "Informatique industrielle", "Audit énergétique", "Spécialiste en efficacité énergétique"]
    }, {
      filiere: "Génie du Froid et Climatisation",
      quotas: "Bourse: 30  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Technicien en froid et climatisation du bâtiment", "Technicien en froid industriel", "Maintenance du bâtiment", "Spécialiste en appareillage", "Conditionnement d’air", "Climatisation"]
    }],
    "ENSET": [{
      filiere: "Énergétique",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges"]
    }, {
      filiere: "Électrotechnique",
      quotas: "Bourse: 13  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges"]
    }],
    "INSTI": [{
      filiere: "Informatique et Systèmes Industriels",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 24  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Service informatique en entreprise", "Études et réalisation de systèmes électroniques"]
    }, {
      filiere: "Génie Électrique (Électrotechnique, Électronique, Électromécanique)",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 76  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Études et réalisation de systèmes électroniques", "Maintenance industrielle"]
    }, {
      filiere: "Maintenance des Systèmes Industriels",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 21  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Maintenance industrielle"]
    }, {
      filiere: "Maintenance des Systèmes Automobiles",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 25  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Maintenance automobile"]
    }],
    "INSGMP": [{
      filiere: "Génie Mécanique et Productique",
      niveau: "Licence / Ingénieur",
      dureeFormation: "3 ans",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Maintenance industrielle", "Ingénieur de conception"]
    }],
    "INSPT": [{
      filiere: "Sciences et Techniques de l’Ingénieur",
      niveau: "Licence / Ingénieur",
      dureeFormation: "3 ans",
      quotas: "Bourse: 83  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Maintenance industrielle", "Ingénieur de conception"]
    }],
    "ENS-MI": [{
      filiere: "Mathématiques et Informatique",
      niveau: "Licence",
      dureeFormation: "3 ans",
      quotas: "Bourse: 29  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Professeur adjoint de Mathématiques", "Chercheur en informatique"]
    }],
    "École Normale et Scientifique": [{
      filiere: "Physique Chimie",
      quotas: "Bourse: 17  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Culture Générale", "Physique-Chimie"]
      },
      debouches: ["Professeur adjoint de Physique-Chimie"]
    }, {
      filiere: "Sciences de la Vie et de la Terre (SVT)",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Culture Générale", "SVT"]
      },
      debouches: ["Professeur adjoint de SVT"]
    }],
    "ENSBB": [{
      filiere: "Biotechnologie Médicale",
      quotas: "Bourse: 11  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en biotechnologie médicale et pharmaceutique", "Assistant de recherche en biotechnologie médicale", "Technicien supérieur en bioproduits", "Autoremploi en bioproduits"]
    }, {
      filiere: "Biotechnologie Pharmaceutique (BP)",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Diplômé dans les industries pharmaceutiques et chimiques", "Assistant de recherche en biotechnologie pharmaceutique", "Technicien supérieur en biotechnologie pharmaceutique et bioproduits", "Autoremploi en biotechnologie pharmaceutique"]
    }, {
      filiere: "Génétique et Biotechnologies Appliquées",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Chercheur en génétique et biotechnologies appliquées", "Spécialiste en gestion des ressources génétiques", "Concepteur de tests génétiques", "Biotechnologies végétales et animales", "Autoremploi"]
    }, {
      filiere: "Génie Biologique et Bioprocédés (GBB)",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en analyse biologique", "Technicien supérieur en recherche biotechnologique", "Assistant de recherche en biologie et pharmacie", "Autoremploi"]
    }, {
      filiere: "Diététique des Aliments et Nutrition",
      quotas: "Bourse: 9  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en diététique", "Nutritionniste en restauration collective", "Conseiller en alimentation thérapeutique", "Autoremploi en diététique et nutrition"]
    }],
    "FASTI Natitingou": [{
      filiere: "Mathématiques Informatiques",
      quotas: "Quota: 83  Bourse: 43",
      modeEntree: "Classement",
      bacRecommande: ["E", "D"],
      matieresParSerie: {
        "default": ["Anglais", "C", "C++", "Mathématiques"]
      },
      debouches: ["Cadre en télécommunications logiques", "Enseignant en collèges et lycées (CAPES)", "Analyste, concepteur, ingénieur en informatique et électronique", "Chargé de télécommunications et réseaux informatiques", "Cadre d’administration publique ou privée", "Enseignant ou formateur en physique ou chimie", "Accès à un master recherche en physique ou chimie", "Emplois en géophysique, géochimie, géologie, météorologie, environnement, industries pharmaceutiques"]
    }],
    "ENSEEF": [{
      filiere: "Froid et Climatisation",
      quotas: "Quota: 25  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["D", "DT/Froid et Clim"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "TFT(D)", "Froid et Climatisation"]
      },
      debouches: ["Technicien supérieur en installation et maintenance d’équipements de froid et climatisation", "Technicien supérieur en équipements frigorifiques et climatiques"]
    }, {
      filiere: "Équipements motorisés",
      quotas: "Quota: 24  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["D", "DT/MVA", "DT/FM"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "DT/MVA", "DT/FM"]
      },
      debouches: ["Technicien supérieur en maintenance de matériels roulants et engins hydrauliques", "Maintenance des engins hydrauliques et pneumatiques des services et travaux publics"]
    }],
    "ENST": [{
      filiere: "Génie Civil",
      quotas: "Quota: 21  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "DT/BTP", "Architecture (EA)"]
      },
      debouches: ["Technicien supérieur en bâtiment, génie civil, architecture et travaux publics", "Surveillant de chantier", "Conducteur de travaux"]
    }],
    "Génie Géomatique Appliquée": [{
      "filiere": "Génie Géomatique Appliquée",
      "quotas": "Places: 21",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)"]
      },
      "debouches": ["Assistants des Experts Géomètres", "Assistants des architectes", "Ingénieurs en Système d’Information Géographique", "Techniciens Cartographes", "Techniciens des services déconcentrés et Mairies", "Assistants dans les bureaux d’études"]
    }],
    "École Nationale d’Architecture et d’Urbanisme (ENAU)": [{
      "filiere": "Architecture et Urbanisme",
      "quotas": "Places: 26",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)"]
      },
      "debouches": ["Techniciens Conducteurs Urbanistes", "Techniciens Conducteurs de bâtiments", "Urbanistes Assistants des équipes d’aménagements et d’architectes", "Techniciens des services déconcentrés et Mairies", "Assistants dans les bureaux d’architecture", "Assistants dans les agences d’urbanisme", "Assistants dans les bureaux d’études"]
    }],
    "École Nationale Supérieure des Travaux Publics (ENSTP)": [{
      "filiere": "Hydraulique et Assainissement",
      "quotas": "Places: 25",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "E", "A", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)", "Assainissement (EA)"]
      },
      "debouches": ["Techniciens de l’hydraulique et assainissement", "Assistants des laboratoires d’analyse d’eaux", "Techniciens de gestion d’adduction d’eaux", "Techniciens de gestion d’assainissement", "Techniciens de gestion de traitement des eaux", "Techniciens des services déconcentrés et Mairies", "Assistants des hydrologues", "Assistants des hydrogéologues en bureaux d’études"]
    }]
  },
  "Université Nationale d’Agriculture": {
    " École d’Aquaculture (Eaq)": [{
      "filiere": "Aquaculture",
      "quotas": "Bourse – Adéf/FP: 31",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Aquaculture", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Chef des entreprises aquacoles", "Technicien en conception, fabrication des aliments et matériels aquacoles", "Conseiller ou assistant en aquaculture"]
    }],
    " École d’Horticulture et d’Aménagement des Espaces Verts (EHAEV)": [{
      "filiere": "Horticulture et aménagement des espaces verts",
      "quotas": "Bourse – Adéf/FP: 55",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Agronomie", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Chef des entreprises horticoles et florales", "Technicien en production et sélection horticoles (fruits, légumes, plantes ornementales)", "Technicien en aménagement des espaces verts", "Technicien en production et transformation des produits horticoles", "Technicien en culture hydroponique ou aquaponique", "Technicien en biotechnologie horticole et florale"]
    }],
    " École de Gestion et Exploitation des Systèmes Végétaux et Semenciers (EGSVS)": [{
      "filiere": "Gestion et exploitation des systèmes végétaux et semenciers",
      "quotas": "Bourse – Adéf/FP: 0",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Agronomie", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Conseiller ou technicien en conception des infrastructures semencières", "Technicien en production et amélioration des semences horticoles et céréalières", "Technicien en gestion des infrastructures de production semencière", "Technicien en contrôle de qualité des semences", "Technicien en biotechnologie végétale", "Technicien en culture hydroponique ou aquaponique"]
    }],
    " École des Sciences et Techniques de Transformation des Produits Agricoles et Agroalimentaires (ESTTPAA)": [{
      "filiere": "Transformation des produits agricoles et agroalimentaires",
      "quotas": "Bourse – Adéf/FP: 23",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Nutrition", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien en production, transformation et conservation des produits agricoles et agroalimentaires", "Technicien en contrôle de qualité des produits agricoles et agroalimentaires", "Technicien en biotechnologie alimentaire", "Technicien en industries agroalimentaires", "Technicien en nutrition humaine et animale", "Technicien en valorisation des produits agricoles et agroalimentaires"]
    }],
    " Industrie des Bio-ressources (IBR)": [{
      "filiere": "Technologie alimentaire et bioressources",
      "quotas": "Bourse ANaP/PEP: 22",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur des industries des bioressources", "Technicien supérieur dans les filières économiques et de transformation des produits agricoles", "Enseignant dans les lycées techniques agricoles"]
    }],
    " Guide de l’environnement et de l’aménagement des produits alimentaires (GES)": [{
      "filiere": "Conditionnement, emballage et conservation des produits alimentaires",
      "quotas": "Bourse ANaP/PEP: 21",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur dans le conditionnement-emballage et conservation des produits alimentaires", "Technicien supérieur dans les filières économiques et de transformation des produits agricoles", "Enseignant dans les lycées techniques agricoles"]
    }],
    " École de Génie Rural (EGR)": [{
      "filiere": "Agroéquipement",
      "quotas": "Bourse ANaP/PEP: 16",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur en entreprises de conception et fabrication des machines agricoles", "Technicien de maintenance des matériels et équipements agricoles", "Technicien supérieur en maintenance des équipements agricoles", "Enseignant dans les lycées techniques agricoles"]
    }, {
      "filiere": "Infrastructures et Assainissement",
      "quotas": "Bourse/Aide/HFP: 0",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/OGS", "DT/OS BAT/AR"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Entreprises de travaux de construction ou ouvrages hydrauliques et d’assainissement", "Entreprises d’aménagement hydro-agricole", "Services techniques des collectivités locales", "Services déconcentrés des ministères", "Bureaux d’études et de conseils", "ONG"]
    }],
    " Électrification Rurale et Énergies Renouvelables (ERER)": [{
      "filiere": "Électrification rurale et énergies renouvelables",
      "quotas": "Bourse ANaP/PEP: 17",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Électrotechnique"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur en électrification rurale", "Technicien supérieur en énergies renouvelables", "Technicien supérieur en maintenance des installations électriques", "Enseignant dans les lycées techniques agricoles"]
    }],
    " École de Gestion et Production Animale et Halieutique (EGPAH)": [{
      "filiere": "Productions animales et halieutiques",
      "quotas": "Bourse/Aide/HFP: 57",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Élevage", "Transformation et production des sous-produits de consommation animale", "Entreprises et fermes d’élevage", "Services techniques des collectivités locales", "ONG"]
    }],
    " École des Agriculteurs et Vulgarisateurs Agricoles (EAVA)": [{
      "filiere": "Finances agricoles (FA)",
      "quotas": "Bourse/Aide/HFP: 16",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Financement agricole", "Services techniques des collectivités locales", "ONG"]
    }, {
      "filiere": "Gestion des exploitations agricoles et vulgarisation agricole (GEAVA)",
      "quotas": "Bourse/Aide/HFP: 0",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Encadrement et vulgarisation agricole", "Coopératives et associations agricoles", "Services techniques des collectivités locales", "ONG"]
    }, {
      "filiere": "Machinisme des productions agricoles (MPA)",
      "quotas": "Bourse/Aide/HFP: 36",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Conception et entretien des machines agricoles", "Services techniques des collectivités locales", "ONG"]
    }],
    " École de Sociologie Rurale et d’Animation Agricole (ESRAA)": [{
      "filiere": "Sociologie rurale et animation agricole",
      "quotas": "Quota d’allocation bourse: 03",
      "modeEntree": "Pour C, D, S, STT",
      "bacRecommande": ["C", "D", "E", "F4"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur des entreprises agricoles", "Technicien supérieur des entreprises forestières", "Technicien supérieur des entreprises de pêche", "Technicien supérieur des entreprises d’élevage", "Sociologue rural", "Animateur agricole et rural", "Conseiller agricole", "Chargé d’études et d’enquêtes agricoles et rurales", "Chargé de communication et de vulgarisation agricole et rurale", "Chargé de développement rural", "Chargé de projet de développement rural", "Chargé de mission sociale dans les organisations paysannes", "Enseignant dans les établissements d’enseignement agricole", "Employé dans les services de développement rural et agricole", "Employé dans les services de vulgarisation agricole et rurale", "Employé dans les services de planification agricole et rurale", "Employé dans les services de développement communautaire", "Employé dans les services de développement social", "Employé dans les services de développement rural intégré", "Employé dans les services de développement participatif", "Employé dans les services de développement local", "Employé dans les services de développement durable"]
    }]
  },
  "Institut Universitaire d’Enseignement Professionnel": {
    " Métiers de l’agriculture": [{
      "filiere": "Métiers de l’agriculture",
      "quotas": "Bourse/Aide/FPP: 50",
      "modeEntree": "Concours",
      "bacRecommande": ["Culture générale", "DEAT (toutes options)"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers de l’agriculture"]
    }]
  },
  "Écoles Inter-États": {
    " École Inter-États des Sciences et Médecine Vétérinaires (EISMV)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 8",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Vétérinaires"]
    }],
    " École Africaine des Métiers de l’Architecture et de l’Urbanisme (EAMAU)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 5",
      "modeEntree": "Concours",
      "bacRecommande": ["C", "D"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Architectes", "Urbanistes"]
    }],
    " École Supérieure Multinationale de Télécommunications (ESMT)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 11",
      "modeEntree": "Concours",
      "bacRecommande": ["C", "D", "DT"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Multinationale", "Télécommunications"]
    }],
    " Institut de Formation et de Recherche en Population et Développement (IFORD)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 5",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " Centre Africain d’Études Supérieures en Gestion (CESAG)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 26",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " Centre Appui aux Écoles de Statistique Africaines (CAPESA)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 6",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " École Centrale de Casablanca": [{
      "filiere": "",
      "quotas": "Bourse/Aide/FPP: 0",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }]
  },
  "Université Africaine de Développement Coopératif": {
    " UFR Économie et Gestion des Coopératives (UFR/EGC)": [{
      "filiere": "Entrepreneuriat et Gestion de Projets et Économie Sociale",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Chef de projets des entreprises publiques, privées et ONG", "Salarié de projets, entreprises industrielles, commerciales et PME", "Cabinet de conseil", "Consultant en développement local", "Coordinateur de projets", "Animateur et évaluateur de projets"]
    }, {
      "filiere": "Économie et Gestion des Coopératives et Associations",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Gestionnaire d’Action Coopérative", "Chargé de développement des Coopératives", "Chargé de gestion des Associations", "Chargé de relations internationales Coopératives"]
    }],
    " UFR Finances et Microfinance (UFR/FM)": [{
      "filiere": "Micro Finance",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Inspecteur des Finances option Micro Finance", "Chargé d’études financières", "Chargé de développement des Communautés", "Agent de crédit des institutions financières (SFD)"]
    }],
    " UFR Renforcement et Micro Assurance Santé (UFR/RMAS)": [{
      "filiere": "Gestion des structures de Micro Assurance Santé",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Histoire-Géo (A) ou Maths (B) ou Économie (C)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Histoire-Géo", "Mathématiques", "Économie"]
      },
      "debouches": ["Spécialiste d’Action Sanitaire option Micro Assurance Santé", "Chargé de Renforcement du Capital Humain", "Chargé d’Assurance Santé", "Agent d’Assurance Santé", "Agent d’Assurance des Mutuelles de Santé", "Éducateur mutuelles de santé"]
    }],
    " Développement Local et Décentralisation (IRFODEL)": [{
      "filiere": "Développement Local et Décentralisation",
      "quotas": "Bourse/Aide/FFP: A, B, C, D, G2, G3",
      "modeEntree": "À titre payant",
      "bacRecommande": ["A", "B", "C", "D", "G2", "G3"],
      "matieresParSerie": {
        "default": ["Sèmè et développement"]
      },
      "debouches": ["Ingénieurs de développement local et de décentralisation", "Agents de développement local des collectivités", "Spécialistes de la coopération-développement local", "Responsables de projets de développement local", "Animateur développement", "Manager du développement", "Chef de projet de développement", "Entrepreneur"]
    }]
  },
  "Etablissements de Sèmè-City": {
    " Africa Design School": [{
      "filiere": "Licence en Design",
      "quotas": "À titre payant",
      "modeEntree": "À titre payant",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers du design"]
    }],
    " Ecole de l’Innovation et de l’Expertise Informatique (EPITECH)": [{
      "filiere": "Licence en Métier de l’Informatique",
      "quotas": "À titre payant",
      "modeEntree": "À titre payant",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers de l’informatique"]
    }]
  }
}


























































































































































      // Coefficients par série
/* const coefficients = {
  A1:{ 
    "Français":5,
    "Philosophie":4,
    "LV1":4,
    "LV2":3,
    "Histoire-Géo":3,
    "Mathématiques":2,
    "EPS":1 },
  A2:{ 
    "Français":5,
    "Philosophie":4,
    "Histoire-Géo":4,
    "LV1":3,"LV2":2,
    "Mathématiques":2,
    "EPS":1 },
  B:{ 
    "Français":5,
    "Philosophie":3,
    "Économie":4,
    "Histoire-Géo":3,
    "LV1":3,
    "Mathématiques":2,
    "EPS":1 },
  C:{ 
    "Mathématiques":6,
    "Physique-Chimie":5,
    "SVT":2,
    "Français":2,
    "Philosophie":2,
    "Anglais":2,
    "Histoire-Géo":2,
    "EPS":1 },
  D:{ 
    "SVT":5,
    "Physique-Chimie":4,
    "Mathématiques":4,
    "Français":2,
    "Philosophie":2,
    "Anglais":2,
    "Histoire-Géo":2,
    "EPS":1 },
  
  E:{ 
    "Mathématiques":6,
    "Physique-Chimie":5,
    "Technologie":5,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "EPS":1 },
    EA:{

    },
  F1:{ 
    "Mécanique":6,
    "Dessin industriel":5,
    "Mathématiques":4,
    "Physique-Chimie":3,
    "Français":2,
    "Philosophie":2,
    "EPS":1 },
  F2:{ 
    "Électronique":6,
    "Mathématiques":5,
    "Physique-Chimie":4,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "EPS":1 },
  F3:{ 
    "Électrotechnique":6,
    "Mathématiques":5,
    "Physique-Chimie":4,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "EPS":1 },
  F4:{ 
    "Génie civil":6,
    "Dessin technique":5,
    "Mathématiques":4,
    "Physique-Chimie":3,
    "Français":2,
    "Philosophie":2,
    "EPS":1 },
  G1:{ 
    "Administration":5,
    "Comptabilité":4,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "Mathématiques":2,
    "EPS":1 },
  G2:{ 
    "Comptabilité":5,
    "Économie":4,
    "Mathématiques":4,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "EPS":1 },
  G3:{ 
    "Commerce":5,
    "Économie":4,
    "Français":3,
    "Philosophie":2,
    "LV1":2,
    "Mathématiques":2,
    "EPS":1 },
  
};



// Sélecteurs
const serie=document.getElementById("serie");
const form=document.getElementById("notesForm");
const matieres=document.getElementById("matieres");
const resultat=document.getElementById("resultat");
const classementDiv=document.getElementById("classements");

serie.addEventListener("change",afficherMatieres);
form.addEventListener("submit",calculer);

function afficherMatieres(){
  matieres.innerHTML="";
  const choix=serie.value;
  if(!choix) return;

  // Certaines séries (DT/..., DEAT/..., EA) n'ont pas encore de barème de coefficients
  // renseigné dans cet outil : on évite un plantage et on prévient l'utilisateur.
  if(!coefficients[choix] || Object.keys(coefficients[choix]).length === 0){
    matieres.innerHTML = `<p style="color:#e53935;font-weight:bold;">Les matières et coefficients pour la série "${choix}" ne sont pas encore configurés dans cet outil. Merci de contacter l'administrateur.</p>`;
    return;
  }

  Object.entries(coefficients[choix]).forEach(([matiere])=>{
    const div=document.createElement("div");
    div.className="champ";
    div.innerHTML=`
      <label>${matiere}</label>
      <input type="number" id="${matiere}" min="0" max="20" step="0.25" required>
    `;

    // Ajouter une case à cocher pour EPS
    if(matiere === "EPS"){
      div.innerHTML += `
        <div class="dispense-container">
          <label for="dispenseEPS">Dispensé d'EPS</label>
          <input type="checkbox" id="dispenseEPS">
        </div>
      `;
    }

    matieres.appendChild(div);

    // Gestion dynamique du champ EPS (branchée une fois le champ réellement
    // présent dans le DOM, sans setTimeout : évite une course si l'utilisateur
    // change de série juste après avoir sélectionné une série avec EPS)
    if(matiere === "EPS"){
      const epsInput = document.getElementById("EPS");
      const dispenseBox = document.getElementById("dispenseEPS");

      dispenseBox.addEventListener("change", ()=>{
        if(dispenseBox.checked){
          epsInput.removeAttribute("required"); // ne plus obligatoire
          epsInput.disabled = true;             // désactive le champ
          epsInput.value = "";                  // vide la valeur
        } else {
          epsInput.setAttribute("required","true"); // redevient obligatoire
          epsInput.disabled = false;                // réactive le champ
        }
      });
    }
  });
}

    
function calculer(e){
  e.preventDefault();
  if(!form.checkValidity()){ form.reportValidity(); return; }

  const choix=serie.value;

  // Garde-fou : série sans barème configuré
  if(!coefficients[choix] || Object.keys(coefficients[choix]).length === 0){
    resultat.innerHTML = `<p style="color:#e53935;">Impossible de calculer : la série "${choix}" n'est pas encore configurée.</p>`;
    return;
  }

  let total=0, coeffTotal=0;

  // Moyenne générale
  Object.entries(coefficients[choix]).forEach(([matiere,coef])=>{
    const note=parseFloat(document.getElementById(matiere).value);

    // Vérifier si EPS est dispensé
    if(matiere === "EPS" && document.getElementById("dispenseEPS").checked){
      return; // Ignorer EPS
    }

    total+=note*coef;
    coeffTotal+=coef;
  });

  const moyenne=(total/coeffTotal).toFixed(2);
  resultat.innerHTML=`<h2>Moyenne générale : ${moyenne}/20</h2>`;
}



  // Nettoyer la zone des classements
  classementDiv.innerHTML="";

// Générer un tableau par université avec accordéon
Object.entries(ecoles).forEach(([universite, etablissements])=>{
  
  // Bloc accordéon
  const accordionItem = document.createElement("div");
  accordionItem.className = "accordion-item";

  // Bouton d’en-tête (université)
  const header = document.createElement("button");
  header.className = "accordion-header";
  header.textContent = universite;

  // Contenu accordéon
  const content = document.createElement("div");
  content.className = "accordion-content";

  // Tableau pour cette université
  const tableau=document.createElement("table");
  tableau.className="resultats";
  tableau.innerHTML=`
    <tr>
      <th>Établissement</th>
      <th>Filière</th>
      <th>Quotas</th>
      <th>Bac</th>
      <th>Moyenne</th>
      <th>Matières</th>
      <th>Débouchés</th>
    </tr>
  `;

  let resultats=[];

  Object.entries(etablissements).forEach(([etablissement, filieres])=>{
    filieres.forEach(filiere=>{
      if(!filiere.bacRecommande.some(bac=>{
        if(bac==="A") return choix==="A1"||choix==="A2";
        if(bac==="F") return choix.startsWith("F");
        if(bac==="DT/STI") return choix.startsWith("F")||choix.startsWith("G")||choix==="E";
        return bac===choix;
      })) return;

      let totalClassement=0, sommeCoeff=0;
      const matieresFiliere=filiere.matieresParSerie[choix] || filiere.matieresParSerie["default"];

      matieresFiliere.forEach(matiere=>{
        if(notes[matiere]!==undefined){
          const coefSerie=coefficients[choix][matiere] || 1;
          totalClassement+=notes[matiere]*coefSerie;
          sommeCoeff+=coefSerie;
        }
      });

      const moyenneClassement=sommeCoeff>0 ? (totalClassement/sommeCoeff).toFixed(2) : "-";

      resultats.push({
        etablissement,
        filiere:filiere.filiere,
        quotas:filiere.quotas,
        bac:filiere.bacRecommande.join(", "),
        moyenne:moyenneClassement,
        matieres:matieresFiliere.join(", "),
        debouches:filiere.debouches.join("<br>")
      });
    });
  });

  resultats.sort((a,b)=>parseFloat(b.moyenne)-parseFloat(a.moyenne));

  resultats.forEach(r=>{
    tableau.innerHTML+=`
      <tr>
        <td>${r.etablissement}</td>
        <td>${r.filiere}</td>
        <td>${r.quotas}</td>
        <td>${r.bac}</td>
        <td><strong>${r.moyenne}/20</strong></td>
        <td>${r.matieres}</td>
        <td>${r.debouches}</td>
      </tr>
    `;
  });

  // Ajouter le tableau dans le contenu
  content.appendChild(tableau);

  // Ajouter header + contenu dans l’accordéon
  accordionItem.appendChild(header);
  accordionItem.appendChild(content);
  classementDiv.appendChild(accordionItem);
});

// Gestion du clic pour ouvrir/fermer accordéon
document.addEventListener("click", function(e){
  if(e.target.classList.contains("accordion-header")){
    const currentItem = e.target.parentElement;

    // Fermer les autres accordéons
    document.querySelectorAll(".accordion-item").forEach(item=>{
      if(item !== currentItem){
        item.classList.remove("active");
      }
    });

    // Ouvrir/fermer celui cliqué
    currentItem.classList.toggle("active");
  }
});





// Structure imbriquée avec matières par série
const ecoles = {
  "Université d’Abomey-Calavi": {
    "Institut Régional de Santé Publique (IRSP)": [{
      filiere: "Santé Publique polyvalente",
      quotas: "Bourse: 16  Aide: 7",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique-Chimie", "SVT"]
      },
      debouches: ["Agent de santé communautaire", "Responsable de surveillance épidémiologique", "Attaché de recherche en santé", "Assistant en planification, suivi et évaluation en santé", "Agent d’hygiène et d’assainissement du milieu"]
    }],
    "FLASH": [{
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 69  Aide: 446",
      modeEntree: "Classement",
      bacRecommande: ["A", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géo", "Mathématiques"]
      },
      debouches: ["Enseignement", "Laboratoires", "Assainissement"]
    }, {
      filiere: "Socio-Anthropologie",
      quotas: "Bourse: 69  Aide: 446",
      modeEntree: "Classement",
      bacRecommande: ["A", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géo", "Mathématiques"]
      },
      debouches: ["Centres sociaux", "Ministères", "Institutions de recherche"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 157  Aide: 891",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "DT/STI", "DEAT"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Interprétariat", "Tourisme", "Enseignement"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 12  Aide: 75",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand (LV1)", "Anglais", "Histoire-Géo"]
      },
      debouches: ["Professeur de lycée", "Interprète", "Traducteur"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 60  Aide: 311",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol (LV1)", "Anglais", "Histoire-Géo"]
      },
      debouches: ["Professeur de lycée", "Interprète", "Traducteur"]
    }, {
      filiere: "Lettres Modernes",
      quotas: "Bourse: 100  Aide: 75",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignement"]
    }, {
      filiere: "Sciences Religieuses et Relations Internationales",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Philosophie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Anglais (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol (LV1)"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire"]
    }, {
      filiere: "Sociologie Anthropologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur en sciences sociales"]
    }, {
      filiere: "Lettres Modernes",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }],
    "INMAAC": [{
      filiere: "Arts dramatiques",
      quotas: "Bourse: 8  Aide: 60",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Comédien", "Danseur", "Musicien"]
    }, {
      filiere: "Arts plastiques",
      quotas: "Bourse: 8  Aide: 60",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Arts plastiques"]
      },
      debouches: ["Peintre", "Sculpteur", "Designer", "Photographe", "Art appliqué"]
    }, {
      filiere: "Musique et Musicologie",
      quotas: "Bourse: 0  Aide: -",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Chanteur", "Compositeur", "Chef d’orchestre", "Opérateur de son", "Mixeur", "Arrangeur"]
    }, {
      filiere: "Cinéma et Audiovisuel",
      quotas: "Bourse: 0  Aide: -",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Scénariste", "Réalisateur", "Spécialiste en audiovisuel", "Monteur", "Graphiste"]
    }],
    "CIFRED": [{
      filiere: "Aménagement, réadaptation, sauvegarde environnementale et gestion/restauration de l’environnement",
      quotas: "Bourse: 56  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Inspecteur d’action militaire", "Ingénieur en environnement"]
    }],
    "IGATE": [{
      filiere: "Gestion du cadre de vie",
      quotas: "Bourse: 56  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Aménagement", "Réadaptation", "Sauvegarde environnementale", "Gestion et restauration de l’environnement"]
    }, {
      filiere: "Gestion des Environnements et des Ecosystèmes",
      quotas: "Bourse: 35  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Changement climatique", "Aménagement et gestion des ressources naturelles"]
    }, {
      filiere: "Géomatique et Environnement",
      quotas: "Bourse: 35  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Spécialiste en cartographie"]
    }],
    "INE": [{
      filiere: "Sciences Infirmières",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Spécialisation en planification et gestion des espaces urbains"]
    }, {
      filiere: "Sciences Obstétricales",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Soins infirmiers dans les hôpitaux et centres de santé"]
    }, {
      filiere: "Hydrologie et Hydrogéologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Hydrologue", "Hydrogéologue"]
    }, {
      filiere: "Environnement et Hygiène",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Français", "Anglais"]
      },
      debouches: ["Contrôle d’eau", "Travaux d’assainissement et bases"]
    }, {
      filiere: "Gestion des Eaux et Climat",
      quotas: "Bourse: 27  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Hydrologues", "Hydrogéologues", "Agents des eaux et forêts", "Contrôle de la qualité physico-chimique de base"]
    }, {
      filiere: "Génie rural et maîtrise d’eau (GMRE)",
      quotas: "Bourse: 19  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Aménagements hydro-agricoles", "Contrôleur des ouvrages d’assainissement hydro-agricoles"]
    }, {
      filiere: "Hydraulique et Assainissement (HA)",
      quotas: "Bourse: 55  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Hydraulicien", "Ingénieur en génie sanitaire"]
    }, {
      filiere: "Eau Hygiène et Assainissement (EHA)",
      quotas: "Bourse: 54  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "EAT", "EA"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Contrôleur des ouvrages d’assainissement hydro-agricoles", "Ingénieur en génie sanitaire"]
    }],
    "ENEAM": [{
      filiere: "Administration des Réseaux Informatiques",
      quotas: "Bourse: 50  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "DT/MI"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Technicien en réseaux informatiques"]
    }, {
      filiere: "Analyse Informatique et Programmation",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "DT/MI"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Développeur d’applications Desktop", "Développeur Web", "Développeur Mobile"]
    }, {
      filiere: "Assurance",
      quotas: "Bourse: 7  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "Q2", "Q3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Chargés de clientèle"]
    }, {
      filiere: "Banque et Finance de Marché",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "Q2", "Q3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Anglais", "Français"]
      },
      debouches: ["Gestionnaires de patrimoine", "Gestionnaires de portefeuille"]
    }],
    "Banque d’Instructions des Micro Finances": [{
      filiere: "Banque et Assurance",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Étude de cas", "Anglais"]
      },
      debouches: ["Chargé de clientèle", "Gestionnaire de patrimoine et de portefeuilles"]
    }],
    "ENAM": [{
      filiere: "Marketing",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["B", "C", "D", "G3", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Étude de cas", "Anglais"]
      },
      debouches: ["Chargé d’étude développement commercial", "Chef de produit", "Chargé d’étude marketing", "Chef de publicité", "Chargé de communication", "Chef de projet communication", "Responsable de communication", "Responsable marketing digital", "Responsable de stratégie digitale", "Responsable de marque", "Responsable de développement digital brand", "Community manager", "Data analyst", "Digital project manager", "Responsable e-commerce", "Digital planner", "Consultant en marketing digital (SEM/SEO)", "Chef de produit digital", "Responsable de développement numérique", "Chef de projet web", "Marketing manager", "Chef de vente", "Responsable commercial", "Chargé d’affaires", "Responsable des ressources humaines"]
    }, {
      filiere: "Planification Gestion et Administration des Projets",
      quotas: "Bourse: 23  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire de projets", "Chargé d’études", "Conseiller en planification"]
    }, {
      filiere: "Développement Local et Régional",
      quotas: "Bourse: 41  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chargé de développement local", "Consultant en aménagement régional"]
    }, {
      filiere: "Administration Générale",
      quotas: "Bourse: 70  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3", "A1", "A2", "D1", "C", "D", "E"],
      matieresParSerie: {
        "default": ["Français", "Mathématiques", "Histoire-Géographie", "Philosophie", "Anglais", "Économie"]
      },
      debouches: ["Attaché des affaires étrangères", "Inspecteur du Travail et de la Sécurité Sociale"]
    }, {
      filiere: "Administration des Services Financiers",
      quotas: "Bourse: 69  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "G2", "G3", "A1", "A2", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Attaché des services financiers", "Attaché des services administratifs (Centres Hospitaliers)"]
    }, {
      filiere: "Secrétariat de Gestion",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Secrétaire de direction", "Secrétaire administratif", "Assistant de gestion"]
    }, {
      filiere: "Sciences Techniques et Documentaires",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Technicien supérieur en archivistique", "Technicien supérieur documentaliste"]
    }, {
      filiere: "Administration Générale",
      quotas: "Bourse: 70  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3", "A1", "A2", "D1", "C", "D", "E"],
      matieresParSerie: {
        "default": ["Français", "Mathématiques", "Histoire-Géographie", "Philosophie", "Anglais", "Économie"]
      },
      debouches: ["Attaché des affaires étrangères", "Inspecteur du Travail et de la Sécurité Sociale"]
    }, {
      filiere: "Administration des Services Financiers",
      quotas: "Bourse: 69  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "G2", "G3", "A1", "A2", "D1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Attaché des services financiers", "Attaché des services administratifs (Centres Hospitaliers)"]
    }, {
      filiere: "Secrétariat de Gestion",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Secrétaire de direction", "Secrétaire administratif", "Assistant de gestion"]
    }, {
      filiere: "Sciences Techniques et Documentaires",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "D1", "C", "D", "E", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Mathématiques", "Économie"]
      },
      debouches: ["Technicien supérieur en archivistique", "Technicien supérieur documentaliste"]
    }, {
      filiere: "Entrepreneuriat social",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Technicien Supérieur d’Action Sociale Éducative", "Spécialiste en création et gestion d’entreprise"]
    }, {
      filiere: "Histoire et Géographie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en sciences humaines"]
    }, {
      filiere: "Espagnol",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Allemand",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Anglais",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur de langue", "Traducteur", "Interprète"]
    }, {
      filiere: "Français",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en lettres modernes"]
    }, {
      filiere: "Philosophie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Enseignant", "Chercheur en philosophie"]
    }, {
      filiere: "Droit",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Juriste", "Magistrat", "Diplomate"]
    }, {
      filiere: "Sciences Religieuses",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "G2"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Spécialiste en gestion du patrimoine religieux", "Chercheur en sciences religieuses"]
    }],
    "FASEG": [{
      filiere: "Gestion Financière et Comptable",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Comptable", "Financier", "Auditeur interne"]
    }, {
      filiere: "Sciences Économiques et de Gestion (Monnaie et Finance)",
      quotas: "Bourse: 407  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Services déconcentrés de l’État", "Collectivités locales", "Banques et ONG", "Comptabilité", "Audits financiers", "Assurance", "Professions économiques et financières", "Enseignement supérieur et recherche", "Services d’études et de statistiques", "Gestion des marchés", "Gestion des entreprises industrielles et productives"]
    }, {
      filiere: "Économétrie et Statistique Appliquée",
      quotas: "Bourse: 207  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Statistique", "Économétrie", "Analyse économique", "Gestion publique", "Analyse des politiques économiques", "Planification", "Évaluation des projets", "Études économiques et financières", "Gestion des ressources humaines", "Gestion des entreprises", "Audit financier", "Banque", "Assurance"]
    }, {
      filiere: "Sciences et Techniques Financières et Comptables (STFC)",
      quotas: "Bourse: 18  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Audit comptable et financier", "Gestion comptable en entreprise", "Agent comptable", "Gestionnaire"]
    }, {
      filiere: "Économie et Gestion des Ressources Humaines (EGRH)",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Économie"]
      },
      debouches: ["Gestion des RH", "Administration", "Management", "Audit social", "Conseil en organisation", "Gestion des carrières", "Formation", "Communication interne", "Gestion des conflits", "Relations sociales", "Gestion du personnel"]
    }, {
      filiere: "Gestion des Entreprises",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire d’entreprise", "Consultant en management", "Chef de projet"]
    }, {
      filiere: "Gestion des Ressources Humaines",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Responsable RH", "Consultant en organisation", "Chargé de formation"]
    }, {
      filiere: "Gestion Commerciale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Chargé de clientèle", "Responsable commercial", "Consultant en marketing"]
    }],
    "EPA": [{
      filiere: "Gestion du patrimoine culturel",
      quotas: "Bourse: 39  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire du patrimoine", "Conservateur de musée"]
    }, {
      filiere: "Histoire et Archéologie",
      quotas: "Bourse: 82  Aide: 657",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignant", "Chercheur", "Responsable d’établissement"]
    }],
    "FASHS": [{
      filiere: "Psychologie",
      quotas: "Bourse: 44  Aide: 252",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Formation des enseignants", "Psychologues", "Conseillers"]
    }, {
      filiere: "Sciences de l’Éducation et de la Formation",
      quotas: "Bourse: 52  Aide: 52",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignement dans les collèges et lycées"]
    }, {
      filiere: "Philosophie",
      quotas: "Bourse: 175  Aide: 176",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Enseignement", "Recherche"]
    }, {
      filiere: "Sociologie-Anthropologie",
      quotas: "Bourse: 649  Aide: 649",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chercheur", "Consultant en sciences sociales"]
    }, {
      filiere: "Géographie culturelle et économique",
      quotas: "Bourse: 20  Aide: 20",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Chercheur en géographie", "Consultant en aménagement"]
    }],
    "ENSTIC": [{
      filiere: "Journalisme et Communication",
      quotas: "Bourse: 16  Aide: 16",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Journaliste", "Spécialiste en communication"]
    }, {
      filiere: "Communication audiovisuelle et multimédia",
      quotas: "Bourse: 20  Aide: 20",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français", "Anglais"]
      },
      debouches: ["Spécialiste multimédia", "Gestionnaire de production et reproduction"]
    }],
    "IFRI": [{
      filiere: "Génie logiciel",
      quotas: "Bourse: 71  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Analystes et concepteurs", "Administrateurs de bases de données", "Administrateurs réseaux et systèmes", "Développeurs d’applications métiers", "Développeurs d’applications web"]
    }, {
      filiere: "Internet et Multimédia",
      quotas: "Bourse: 14  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Concepteurs d’applications mobiles", "Graphistes et designers numériques", "Monteurs sons et TV", "Web radio"]
    }, {
      filiere: "Génie logiciel",
      quotas: "Bourse: 71  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Analystes et concepteurs", "Administrateurs de bases de données", "Administrateurs réseaux et systèmes", "Développeurs d’applications métiers", "Développeurs d’applications web"]
    }, {
      filiere: "Internet et Multimédia",
      quotas: "Bourse: 14  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Électricité ou Électrodynamique", "Français"]
      },
      debouches: ["Concepteurs d’applications mobiles", "Graphistes et designers numériques", "Monteurs sons et TV", "Web radio"]
    }, {
      filiere: "Intelligence Artificielle (IA)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Développeurs de solutions intelligentes", "Spécialistes en IA appliquée"]
    }, {
      filiere: "Systèmes Numériques et Cyberphysiques (SNC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Concepteurs de solutions domotiques", "Ingénieurs en systèmes embarqués"]
    }, {
      filiere: "Sécurité Informatique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Expert en cybersécurité", "Administrateur sécurité des systèmes"]
    }],
    "FSA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en production végétale", "Chercheur en agronomie"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en conduite des élevages", "Chercheur en zootechnie"]
    }, {
      filiere: "Aménagement et Gestion des Ressources Naturelles",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire des forêts et des parcs naturels", "Consultant en ressources naturelles"]
    }, {
      filiere: "Génie Rural, Foresterie, Pêche et Aquaculture",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "A"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "SVT", "Français", "Anglais"]
      },
      debouches: ["Ingénieur rural", "Spécialiste en foresterie", "Technicien supérieur en pêche et aquaculture"]
    }, {
      filiere: "Nutrition et Technologie Alimentaires",
      quotas: "Bourse: 47  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Technicien en diététique", "Centres de santé", "Industries agroalimentaires"]
    }, {
      filiere: "Agronomie, Environnement et Santé",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Entreprise agricole", "Ferme agricole", "Enseignement et vulgarisation", "Centres de recherche", "Laboratoires"]
    }, {
      filiere: "Entrepreneuriat Agricole",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Gestionnaire de ferme"]
    }, {
      filiere: "Médecine Générale",
      quotas: "Bourse: 150  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en sciences de la santé"]
    }, {
      filiere: "Génie de l’Environnement",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Aménagement et protection de l’environnement", "Consultant en gestion environnementale"]
    }, {
      filiere: "Génie Civil",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur civil", "Spécialiste en construction"]
    }, {
      filiere: "Génie Électrique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur électricien", "Spécialiste en réseaux électriques"]
    }, {
      filiere: "Génie Mécanique et Énergétique",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Fabrication mécanique", "Ingénieur en énergie"]
    }, {
      filiere: "Génie Informatique et Télécom",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur en télécommunications", "Développeur systèmes informatiques"]
    }, {
      filiere: "Génie Chimique procédés",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Ingénieur chimiste", "Spécialiste en procédés industriels"]
    }, {
      filiere: "Hydrobiologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Sur C.E.",
      bacRecommande: ["D", "E"],
      matieresParSerie: {
        "default": ["Biologie", "SVT"]
      },
      debouches: ["Technicien de laboratoire de biologie", "Technicien d’aquaculture", "Technicien d’élevage", "Technicien d’aménagement des zones humides", "Technicien en inspection des produits halieutiques"]
    }],
    "FSS": [{
      filiere: "Pharmacie",
      quotas: "Bourse: 16  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Pharmacien", "Spécialisation en sciences de la santé (option pharmacie)"]
    }, {
      filiere: "Kinésithérapie",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Spécialisation en sciences de la santé (option kinésithérapie)"]
    }, {
      filiere: "Assistance sociale",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "D"],
      matieresParSerie: {
        "default": ["Philosophie", "Histoire-Géographie"]
      },
      debouches: ["Technicien supérieur de l’action sociale"]
    }, {
      filiere: "Nutrition et Diététique",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Nutritionniste dans les hôpitaux", "Nutritionniste dans institutions spécialisées"]
    }, {
      filiere: "Analyse biomédicale",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Technicien de laboratoire d’analyses biomédicales", "Assistant de recherche"]
    }],
    "ETANA": [{
      filiere: "Production et Santé Animales",
      quotas: "Bourse: 37  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "SVT"]
      },
      debouches: ["Médecin vétérinaire", "Technicien supérieur des fermes (UBETA)", "Inspecteur des services vétérinaires", "Enseignant dans les lycées, fermes et collèges agricoles", "Chercheur en production et santé animale", "Chercheur en halieutiques"]
    }],
    "FSA - Spécialisations": [{
      filiere: "Machinisme agricole",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Technicien supérieur en machinisme agricole", "Ingénieur en équipements agricoles"]
    }, {
      filiere: "Génie Biomédical",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Laboratoire de biologie", "Technicien biomédical"]
    }, {
      filiere: "Dynamique de Population et Planification Régionale",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Spécialiste du développement local", "Consultant en planification régionale"]
    }, {
      filiere: "Négocié International",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Négociateur international", "Consultant en commerce extérieur"]
    }, {
      filiere: "Gestion des Relations Internationales",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Diplomate", "Consultant en relations internationales"]
    }, {
      filiere: "Commerce International",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Français", "Anglais"]
      },
      debouches: ["Spécialiste en commerce international", "Gestionnaire d’import-export"]
    }],
    "INJEPS": [{
      filiere: "Éducation Physique et Sportive",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Professeur EPS (CAP/CEAP)", "Cadre d’Appui au Personnel Adjoint de Sport (CAPAS)"]
    }, {
      filiere: "Entraînement Sportif",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Entraîneur sportif", "Conseiller en performance physique"]
    }, {
      filiere: "Andragogie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Formateur pour adultes", "Spécialiste en éducation non formelle"]
    }, {
      filiere: "Récréologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "D", "E", "F", "G"],
      matieresParSerie: {
        "default": ["Français", "Anglais", "Philosophie"]
      },
      debouches: ["Animateur socio-culturel", "Spécialiste en loisirs éducatifs"]
    }],
    "FAST": [{
      filiere: "Sciences de la Vie et de la Terre",
      quotas: "Bourse: 65  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Enseignement des SVT", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Physique-Chimie",
      quotas: "Bourse: 754  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Enseignement de la Physique-Chimie", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Mathématiques et Applications",
      quotas: "Bourse: 717  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Enseignement des Mathématiques", "Recherche de laboratoire", "Institutions de recherche"]
    }, {
      filiere: "Énergies Renouvelables",
      quotas: "Bourse: 27  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Français"]
      },
      debouches: ["Production et fourniture d’énergie électrique", "Recherche en énergétique et technologie appliquée", "Audit énergétique", "Ingénierie des systèmes énergétiques"]
    }, {
      filiere: "Génétique et Biotechnologie",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Recherche génétique et biotechnologie appliquée", "Production dans les industries alimentaires et pharmaceutiques", "Contrôle de qualité alimentaire", "Recherche agronomique", "Recherche vétérinaire et animale"]
    }, {
      filiere: "Microbiologie et Biotechnologie Alimentaire",
      quotas: "Bourse: 17  Aide: 0",
      modeEntree: "Concours commun",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Français"]
      },
      debouches: ["Production dans les industries alimentaires", "Contrôle de qualité alimentaire", "Recherche agronomique", "Recherche vétérinaire et animale"]
    }, {
      filiere: "Aquaculture",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Sur C.E.",
      bacRecommande: ["D", "E"],
      matieresParSerie: {
        "default": ["Biologie", "SVT"]
      },
      debouches: ["Technicien d’aquaculture", "Technicien d’élevage", "Technicien d’aménagement des zones humides", "Technicien en inspection des produits halieutiques"]
    }],
    "Institut Confucius": [{
      filiere: "Langue Chinoise",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Classement sur test",
      bacRecommande: ["Tous"],
      matieresParSerie: {
        "default": ["Trois matières écrites"]
      },
      debouches: ["Entreprise chinoise au Bénin ou dans la sous-région", "Bourses d’études pour universités chinoises"]
    }, {
      filiere: "Didactique du Chinois",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Enseignement", "Traducteur", "Interprète", "Bourses d’études pour universités chinoises"]
    }],
    "ILACI": [{
      filiere: "Langue Arabe",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Tourisme (touristes arabes)", "Administration publique", "Rédacteur publicitaire"]
    }, {
      filiere: "Culture Islamique",
      quotas: "Bourse: 100  Aide: 0",
      modeEntree: "Sur test",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Anglais"]
      },
      debouches: ["Administration publique", "Enseignement", "Prédication religieuse"]
    }],
    "FA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Enseignant", "Technicien", "Chercheur"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      quotas: "Bourse: 20  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Technicien supérieur en zootechnie", "Chercheur en production animale"]
    }, {
      filiere: "Agroéconomie et Sociologie Rurale",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Consultant en développement rural", "Chercheur en agroéconomie", "Gestionnaire de projets agricoles"]
    }, {
      filiere: "Nutrition et Sciences des Aliments",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Nutritionniste", "Chercheur en sciences alimentaires", "Technicien supérieur en industries agroalimentaires"]
    }, {
      filiere: "Médecine Humaine",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en médecine"]
    }],
    "IUFISO": [{
      filiere: "Soins Infirmiers",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Biologie", "Français"]
      },
      debouches: ["Infirmier diplômé d’État"]
    }, {
      filiere: "Soins Obstétricaux",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Mathématiques", "Biologie", "Français"]
      },
      debouches: ["Sage-femme", "Technicien supérieur en obstétrique"]
    }],
    "ENSPAE": [{
      filiere: "Gestion Commerciale",
      quotas: "Bourse: 44  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire commercial", "Chargé de clientèle"]
    }, {
      filiere: "Gestion de l’Entreprise",
      quotas: "Bourse: 59  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire d’entreprise", "Consultant en management"]
    }, {
      filiere: "Gestion des Ressources Humaines",
      quotas: "Bourse: 8  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Responsable RH", "Consultant en organisation"]
    }, {
      filiere: "Informatique de Gestion",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Informatique", "Français"]
      },
      debouches: ["Analyste en informatique de gestion", "Développeur d’applications de gestion"]
    }, {
      filiere: "Gestion de Ressources Logistiques",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire logistique", "Responsable des approvisionnements"]
    }, {
      filiere: "Statistiques Appliquées",
      quotas: "Bourse: 22  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Statistiques", "Économie", "Français"]
      },
      debouches: ["Statisticien", "Analyste de données", "Chargé d’études"]
    }],
    "ENSPD": [{
      filiere: "Économie et Finance des Collectivités Locales (EFL)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Spécialiste en finances locales", "Consultant en gestion des collectivités", "Chargé d’études économiques"]
    }, {
      filiere: "Économie Appliquée (EA)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Analyste économique", "Chargé de planification", "Consultant en politiques publiques"]
    }, {
      filiere: "Audit et Ingénierie Financière des Organisations (AIFO)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Auditeur financier", "Consultant en ingénierie financière", "Gestionnaire de risques"]
    }, {
      filiere: "Finance et Comptabilité (FC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G2", "G3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Comptable", "Contrôleur de gestion", "Responsable financier"]
    }],
    "FDSP": [{
      filiere: "Droit Privé",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Greffier", "Huissier", "Avocat", "Notaire", "Administrateur de biens", "Juriste d’entreprise"]
    }, {
      filiere: "Droit Public",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      dureeFormation: "3 ans",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Greffier", "Huissier", "Avocat", "Notaire", "Administrateur de biens", "Juriste d’entreprise"]
    }]
  },
  "Université de Parakou": {
    "FA": [{
      filiere: "Sciences et Techniques de Production Végétale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Enseignant", "Technicien", "Chercheur"]
    }, {
      filiere: "Sciences et Techniques de Production Animale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Ingénieur agronome", "Technicien supérieur en zootechnie", "Chercheur en production animale"]
    }, {
      filiere: "Agroéconomie et Sociologie Rurale",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Consultant en développement rural", "Chercheur en agroéconomie", "Gestionnaire de projets agricoles"]
    }, {
      filiere: "Nutrition et Sciences des Aliments",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Nutritionniste", "Chercheur en sciences alimentaires", "Technicien supérieur en industries agroalimentaires"]
    }, {
      filiere: "Médecine Humaine",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Cours en présentiel",
      bacRecommande: ["C", "D", "E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Chimie", "Biologie", "SVT"]
      },
      debouches: ["Médecin généraliste", "Spécialisation en médecine"]
    }],
    "ENSPAE": [{
      filiere: "Gestion des Banques",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Gestion", "Français"]
      },
      debouches: ["Gestionnaire bancaire", "Chargé de clientèle", "Analyste financier"]
    }, {
      filiere: "Informatique de Gestion",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Informatique", "Français"]
      },
      debouches: ["Analyste en informatique de gestion", "Développeur d’applications de gestion"]
    }, {
      filiere: "Statistique Appliquée",
      niveau: "Licence",
      dureeFormation: "3 ans",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "G1", "G2", "G3", "G4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Statistiques", "Économie", "Français"]
      },
      debouches: ["Statisticien", "Analyste de données", "Chargé d’études"]
    }],
    "FASEG": [{
      filiere: "Économie et Finance Internationale (EFI)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Consultant en gestion", "Chargé d’études", "Chef de projet", "Analyste financier"]
    }, {
      filiere: "Entrepreneuriat et Gestion des Entreprises (EGE)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Créateur d’entreprise", "Gestionnaire", "Consultant en management"]
    }, {
      filiere: "Marketing et Management des Organisations (MMO)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Responsable marketing", "Chef de produit", "Consultant en communication", "Chargé d’études marketing"]
    }, {
      filiere: "Finance et Comptabilité (FC)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C1", "C2", "C3", "C4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Économie", "Français"]
      },
      debouches: ["Comptable", "Contrôleur de gestion", "Responsable financier"]
    }],
    "FLASH": [{
      filiere: "Lettres Modernes",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français", "Philosophie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Langues Vivantes (Allemand, Anglais, Espagnol)",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Langue vivante choisie"]
      },
      debouches: ["Enseignant", "Traducteur", "Interprète"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire"]
    }, {
      filiere: "Sociologie Anthropologie",
      quotas: "Bourse: 0  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C1", "C2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur en sciences sociales"]
    }, {
      filiere: "Allemand",
      niveau: "Licence",
      specialisation: "Allemand (VU)",
      quotas: "Bourse: 129  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Allemand"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Anglais",
      niveau: "Licence",
      specialisation: "Anglais (VU)",
      quotas: "Bourse: 156  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Anglais"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Espagnol",
      niveau: "Licence",
      specialisation: "Espagnol (VU)",
      quotas: "Bourse: 244  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Espagnol"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Français",
      niveau: "Licence",
      specialisation: "Français (VU)",
      quotas: "Bourse: 431  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Lettres Modernes",
      niveau: "Licence",
      specialisation: "Lettres Modernes (VU)",
      quotas: "Bourse: 101  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Traducteur"]
    }, {
      filiere: "Géographie et Aménagement du Territoire",
      niveau: "Licence",
      specialisation: "Géographie et Aménagement du Territoire (VU)",
      quotas: "Bourse: 115  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Géographie"]
      },
      debouches: ["Enseignant", "Cartographe", "Urbaniste", "Spécialiste en aménagement du territoire", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }, {
      filiere: "Sociologie et Anthropologie",
      niveau: "Licence",
      specialisation: "Sociologie et Anthropologie (VU)",
      quotas: "Bourse: 210  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français"]
      },
      debouches: ["Enseignant", "Chercheur", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }, {
      filiere: "Histoire-Géo",
      niveau: "Licence",
      specialisation: "Histoire-Géo (VU)",
      quotas: "Bourse: 444  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2"],
      matieresParSerie: {
        "default": ["Histoire-Géographie"]
      },
      debouches: ["Enseignant", "Chercheur", "Emplois dans services sociaux, centres de recherche, ministères, ONG, projets"]
    }],
    "FDSP": [{
      filiere: "Droit privé",
      niveau: "Licence",
      specialisation: "Finances publiques / Fiscalité de base",
      quotas: "Bourse: 545  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Avocat", "Magistrat", "Juriste d’affaires", "Greffier", "Conseiller juridique", "Chargé d’études juridiques et fiscales"]
    }, {
      filiere: "Droit public",
      niveau: "Licence",
      specialisation: "Finances publiques / Fiscalité de base",
      quotas: "Bourse: 341  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["A1", "A2", "B", "C", "G1", "G2", "G3"],
      matieresParSerie: {
        "default": ["Français", "Histoire-Géographie", "Philosophie"]
      },
      debouches: ["Avocat", "Magistrat", "Juriste d’affaires", "Greffier", "Conseiller juridique", "Chargé d’études juridiques et fiscales"]
    }]
  },
  "Université Nationale des Sciences, Technologie, Ingénierie et Mathématiques": {
    "Filières Techniques": [{
      filiere: "Comptabilité",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Comptable", "Gestionnaire financier"]
    }, {
      filiere: "Économie",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Économiste", "Chargé d’études"]
    }, {
      filiere: "Électrotechnique",
      modeEntree: "Classement",
      bacRecommande: ["E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Technicien supérieur en électrotechnique", "Ingénieur en systèmes électriques"]
    }, {
      filiere: "Secrétariat",
      modeEntree: "Classement",
      bacRecommande: ["G1"],
      matieresParSerie: {
        "default": ["Culture Générale", "Français", "Anglais"]
      },
      debouches: ["Secrétaire administratif", "Assistant de direction"]
    }, {
      filiere: "Mécanique Automobile",
      modeEntree: "Classement",
      bacRecommande: ["F1", "F2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en mécanique automobile", "Spécialiste en maintenance"]
    }, {
      filiere: "Fabrication Mécanique",
      modeEntree: "Classement",
      bacRecommande: ["F1", "F2"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en fabrication mécanique", "Spécialiste en procédés industriels"]
    }, {
      filiere: "Économie et Gestion",
      modeEntree: "Classement",
      bacRecommande: ["G2", "G3"],
      matieresParSerie: {
        "default": ["Culture Générale", "Mathématiques", "Économie"]
      },
      debouches: ["Gestionnaire", "Consultant en organisation"]
    }, {
      filiere: "Hôtellerie-Restauration",
      modeEntree: "Classement",
      bacRecommande: ["F4", "G1"],
      matieresParSerie: {
        "default": ["Culture Générale", "Français", "Anglais"]
      },
      debouches: ["Gestionnaire hôtelier", "Spécialiste en restauration"]
    }, {
      filiere: "Froid et Climatisation",
      modeEntree: "Classement",
      bacRecommande: ["F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Technicien supérieur en froid et climatisation", "Spécialiste en maintenance énergétique"]
    }, {
      filiere: "Électronique",
      modeEntree: "Classement",
      bacRecommande: ["E", "F"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Technologie"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges", "Technicien supérieur en électronique", "Études en électronique"]
    }],
    "INSTIT": [{
      filiere: "Génie Civil",
      quotas: "Bourse: 68  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais", "Chimie", "SVT"]
      },
      debouches: ["Technicien de Travaux du Génie Civil", "Conducteur de chantiers", "Architecte", "Ingénieur immobilier", "Spécialiste des matériaux"]
    }, {
      filiere: "Génie Énergétique",
      quotas: "Bourse: 37  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Technicien en industrie électrique", "Technicien en électrotechnique", "Technicien en électronique", "Maintenance industrielle", "Instrumentation", "Télécommunication", "Informatique industrielle", "Audit énergétique", "Spécialiste en efficacité énergétique"]
    }, {
      filiere: "Génie du Froid et Climatisation",
      quotas: "Bourse: 30  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Technicien en froid et climatisation du bâtiment", "Technicien en froid industriel", "Maintenance du bâtiment", "Spécialiste en appareillage", "Conditionnement d’air", "Climatisation"]
    }],
    "ENSET": [{
      filiere: "Énergétique",
      quotas: "Bourse: 34  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges"]
    }, {
      filiere: "Électrotechnique",
      quotas: "Bourse: 13  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D", "E", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Culture Générale / Anglais"]
      },
      debouches: ["Professeur adjoint des Lycées et Collèges"]
    }],
    "INSTI": [{
      filiere: "Informatique et Systèmes Industriels",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 24  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Service informatique en entreprise", "Études et réalisation de systèmes électroniques"]
    }, {
      filiere: "Génie Électrique (Électrotechnique, Électronique, Électromécanique)",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 76  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Études et réalisation de systèmes électroniques", "Maintenance industrielle"]
    }, {
      filiere: "Maintenance des Systèmes Industriels",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 21  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Maintenance industrielle"]
    }, {
      filiere: "Maintenance des Systèmes Automobiles",
      niveau: "DUT / BTS",
      dureeFormation: "2 ans",
      quotas: "Bourse: 25  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "Électricité"]
      },
      debouches: ["Maintenance automobile"]
    }],
    "INSGMP": [{
      filiere: "Génie Mécanique et Productique",
      niveau: "Licence / Ingénieur",
      dureeFormation: "3 ans",
      quotas: "Bourse: 38  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Maintenance industrielle", "Ingénieur de conception"]
    }],
    "INSPT": [{
      filiere: "Sciences et Techniques de l’Ingénieur",
      niveau: "Licence / Ingénieur",
      dureeFormation: "3 ans",
      quotas: "Bourse: 83  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Maintenance industrielle", "Ingénieur de conception"]
    }],
    "ENS-MI": [{
      filiere: "Mathématiques et Informatique",
      niveau: "Licence",
      dureeFormation: "3 ans",
      quotas: "Bourse: 29  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F1", "F2", "F3"],
      matieresParSerie: {
        "default": ["Mathématiques", "Physique", "ICT", "Culture Générale"]
      },
      debouches: ["Professeur adjoint de Mathématiques", "Chercheur en informatique"]
    }],
    "École Normale et Scientifique": [{
      filiere: "Physique Chimie",
      quotas: "Bourse: 17  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Culture Générale", "Physique-Chimie"]
      },
      debouches: ["Professeur adjoint de Physique-Chimie"]
    }, {
      filiere: "Sciences de la Vie et de la Terre (SVT)",
      quotas: "Bourse: 12  Aide: 0",
      modeEntree: "Concours",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["Culture Générale", "SVT"]
      },
      debouches: ["Professeur adjoint de SVT"]
    }],
    "ENSBB": [{
      filiere: "Biotechnologie Médicale",
      quotas: "Bourse: 11  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en biotechnologie médicale et pharmaceutique", "Assistant de recherche en biotechnologie médicale", "Technicien supérieur en bioproduits", "Autoremploi en bioproduits"]
    }, {
      filiere: "Biotechnologie Pharmaceutique (BP)",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Diplômé dans les industries pharmaceutiques et chimiques", "Assistant de recherche en biotechnologie pharmaceutique", "Technicien supérieur en biotechnologie pharmaceutique et bioproduits", "Autoremploi en biotechnologie pharmaceutique"]
    }, {
      filiere: "Génétique et Biotechnologies Appliquées",
      quotas: "Bourse: 10  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Chercheur en génétique et biotechnologies appliquées", "Spécialiste en gestion des ressources génétiques", "Concepteur de tests génétiques", "Biotechnologies végétales et animales", "Autoremploi"]
    }, {
      filiere: "Génie Biologique et Bioprocédés (GBB)",
      quotas: "Bourse: 15  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en analyse biologique", "Technicien supérieur en recherche biotechnologique", "Assistant de recherche en biologie et pharmacie", "Autoremploi"]
    }, {
      filiere: "Diététique des Aliments et Nutrition",
      quotas: "Bourse: 9  Aide: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D"],
      matieresParSerie: {
        "default": ["SVT", "Mathématiques"]
      },
      debouches: ["Technicien supérieur en diététique", "Nutritionniste en restauration collective", "Conseiller en alimentation thérapeutique", "Autoremploi en diététique et nutrition"]
    }],
    "FASTI Natitingou": [{
      filiere: "Mathématiques Informatiques",
      quotas: "Quota: 83  Bourse: 43",
      modeEntree: "Classement",
      bacRecommande: ["E", "D"],
      matieresParSerie: {
        "default": ["Anglais", "C", "C++", "Mathématiques"]
      },
      debouches: ["Cadre en télécommunications logiques", "Enseignant en collèges et lycées (CAPES)", "Analyste, concepteur, ingénieur en informatique et électronique", "Chargé de télécommunications et réseaux informatiques", "Cadre d’administration publique ou privée", "Enseignant ou formateur en physique ou chimie", "Accès à un master recherche en physique ou chimie", "Emplois en géophysique, géochimie, géologie, météorologie, environnement, industries pharmaceutiques"]
    }],
    "ENSEEF": [{
      filiere: "Froid et Climatisation",
      quotas: "Quota: 25  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["D", "DT/Froid et Clim"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "TFT(D)", "Froid et Climatisation"]
      },
      debouches: ["Technicien supérieur en installation et maintenance d’équipements de froid et climatisation", "Technicien supérieur en équipements frigorifiques et climatiques"]
    }, {
      filiere: "Équipements motorisés",
      quotas: "Quota: 24  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["D", "DT/MVA", "DT/FM"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "DT/MVA", "DT/FM"]
      },
      debouches: ["Technicien supérieur en maintenance de matériels roulants et engins hydrauliques", "Maintenance des engins hydrauliques et pneumatiques des services et travaux publics"]
    }],
    "ENST": [{
      filiere: "Génie Civil",
      quotas: "Quota: 21  Bourse: 0",
      modeEntree: "Classement",
      bacRecommande: ["C", "D", "E", "F4"],
      matieresParSerie: {
        "default": ["Mathématiques", "Anglais", "ACTC(D)", "DT/BTP", "Architecture (EA)"]
      },
      debouches: ["Technicien supérieur en bâtiment, génie civil, architecture et travaux publics", "Surveillant de chantier", "Conducteur de travaux"]
    }],
    "Génie Géomatique Appliquée": [{
      "filiere": "Génie Géomatique Appliquée",
      "quotas": "Places: 21",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)"]
      },
      "debouches": ["Assistants des Experts Géomètres", "Assistants des architectes", "Ingénieurs en Système d’Information Géographique", "Techniciens Cartographes", "Techniciens des services déconcentrés et Mairies", "Assistants dans les bureaux d’études"]
    }],
    "École Nationale d’Architecture et d’Urbanisme (ENAU)": [{
      "filiere": "Architecture et Urbanisme",
      "quotas": "Places: 26",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)"]
      },
      "debouches": ["Techniciens Conducteurs Urbanistes", "Techniciens Conducteurs de bâtiments", "Urbanistes Assistants des équipes d’aménagements et d’architectes", "Techniciens des services déconcentrés et Mairies", "Assistants dans les bureaux d’architecture", "Assistants dans les agences d’urbanisme", "Assistants dans les bureaux d’études"]
    }],
    "École Nationale Supérieure des Travaux Publics (ENSTP)": [{
      "filiere": "Hydraulique et Assainissement",
      "quotas": "Places: 25",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "E", "A", "F4"],
      "matieresParSerie": {
        "default": ["Mathématiques", "Français (F4)", "Physique", "Chimie", "Technologie (DT/OG, BT/BTP)", "Assainissement (EA)"]
      },
      "debouches": ["Techniciens de l’hydraulique et assainissement", "Assistants des laboratoires d’analyse d’eaux", "Techniciens de gestion d’adduction d’eaux", "Techniciens de gestion d’assainissement", "Techniciens de gestion de traitement des eaux", "Techniciens des services déconcentrés et Mairies", "Assistants des hydrologues", "Assistants des hydrogéologues en bureaux d’études"]
    }]
  },
  "Université Nationale d’Agriculture": {
    " École d’Aquaculture (Eaq)": [{
      "filiere": "Aquaculture",
      "quotas": "Bourse – Adéf/FP: 31",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Aquaculture", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Chef des entreprises aquacoles", "Technicien en conception, fabrication des aliments et matériels aquacoles", "Conseiller ou assistant en aquaculture"]
    }],
    " École d’Horticulture et d’Aménagement des Espaces Verts (EHAEV)": [{
      "filiere": "Horticulture et aménagement des espaces verts",
      "quotas": "Bourse – Adéf/FP: 55",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Agronomie", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Chef des entreprises horticoles et florales", "Technicien en production et sélection horticoles (fruits, légumes, plantes ornementales)", "Technicien en aménagement des espaces verts", "Technicien en production et transformation des produits horticoles", "Technicien en culture hydroponique ou aquaponique", "Technicien en biotechnologie horticole et florale"]
    }],
    " École de Gestion et Exploitation des Systèmes Végétaux et Semenciers (EGSVS)": [{
      "filiere": "Gestion et exploitation des systèmes végétaux et semenciers",
      "quotas": "Bourse – Adéf/FP: 0",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Agronomie", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Conseiller ou technicien en conception des infrastructures semencières", "Technicien en production et amélioration des semences horticoles et céréalières", "Technicien en gestion des infrastructures de production semencière", "Technicien en contrôle de qualité des semences", "Technicien en biotechnologie végétale", "Technicien en culture hydroponique ou aquaponique"]
    }],
    " École des Sciences et Techniques de Transformation des Produits Agricoles et Agroalimentaires (ESTTPAA)": [{
      "filiere": "Transformation des produits agricoles et agroalimentaires",
      "quotas": "Bourse – Adéf/FP: 23",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Nutrition", "Autres séries équivalentes"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien en production, transformation et conservation des produits agricoles et agroalimentaires", "Technicien en contrôle de qualité des produits agricoles et agroalimentaires", "Technicien en biotechnologie alimentaire", "Technicien en industries agroalimentaires", "Technicien en nutrition humaine et animale", "Technicien en valorisation des produits agricoles et agroalimentaires"]
    }],
    " Industrie des Bio-ressources (IBR)": [{
      "filiere": "Technologie alimentaire et bioressources",
      "quotas": "Bourse ANaP/PEP: 22",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur des industries des bioressources", "Technicien supérieur dans les filières économiques et de transformation des produits agricoles", "Enseignant dans les lycées techniques agricoles"]
    }],
    " Guide de l’environnement et de l’aménagement des produits alimentaires (GES)": [{
      "filiere": "Conditionnement, emballage et conservation des produits alimentaires",
      "quotas": "Bourse ANaP/PEP: 21",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur dans le conditionnement-emballage et conservation des produits alimentaires", "Technicien supérieur dans les filières économiques et de transformation des produits agricoles", "Enseignant dans les lycées techniques agricoles"]
    }],
    " École de Génie Rural (EGR)": [{
      "filiere": "Agroéquipement",
      "quotas": "Bourse ANaP/PEP: 16",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Animation Alimentaire"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur en entreprises de conception et fabrication des machines agricoles", "Technicien de maintenance des matériels et équipements agricoles", "Technicien supérieur en maintenance des équipements agricoles", "Enseignant dans les lycées techniques agricoles"]
    }, {
      "filiere": "Infrastructures et Assainissement",
      "quotas": "Bourse/Aide/HFP: 0",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/OGS", "DT/OS BAT/AR"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Entreprises de travaux de construction ou ouvrages hydrauliques et d’assainissement", "Entreprises d’aménagement hydro-agricole", "Services techniques des collectivités locales", "Services déconcentrés des ministères", "Bureaux d’études et de conseils", "ONG"]
    }],
    " Électrification Rurale et Énergies Renouvelables (ERER)": [{
      "filiere": "Électrification rurale et énergies renouvelables",
      "quotas": "Bourse ANaP/PEP: 17",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D", "EAT/Électrotechnique"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur en électrification rurale", "Technicien supérieur en énergies renouvelables", "Technicien supérieur en maintenance des installations électriques", "Enseignant dans les lycées techniques agricoles"]
    }],
    " École de Gestion et Production Animale et Halieutique (EGPAH)": [{
      "filiere": "Productions animales et halieutiques",
      "quotas": "Bourse/Aide/HFP: 57",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Élevage", "Transformation et production des sous-produits de consommation animale", "Entreprises et fermes d’élevage", "Services techniques des collectivités locales", "ONG"]
    }],
    " École des Agriculteurs et Vulgarisateurs Agricoles (EAVA)": [{
      "filiere": "Finances agricoles (FA)",
      "quotas": "Bourse/Aide/HFP: 16",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Financement agricole", "Services techniques des collectivités locales", "ONG"]
    }, {
      "filiere": "Gestion des exploitations agricoles et vulgarisation agricole (GEAVA)",
      "quotas": "Bourse/Aide/HFP: 0",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Encadrement et vulgarisation agricole", "Coopératives et associations agricoles", "Services techniques des collectivités locales", "ONG"]
    }, {
      "filiere": "Machinisme des productions agricoles (MPA)",
      "quotas": "Bourse/Aide/HFP: 36",
      "modeEntree": "Concours d’admission",
      "bacRecommande": ["C", "D", "E", "F4", "F3", "F2", "F1", "G2", "G1", "BT", "DT/EA/TAA"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Conception et entretien des machines agricoles", "Services techniques des collectivités locales", "ONG"]
    }],
    " École de Sociologie Rurale et d’Animation Agricole (ESRAA)": [{
      "filiere": "Sociologie rurale et animation agricole",
      "quotas": "Quota d’allocation bourse: 03",
      "modeEntree": "Pour C, D, S, STT",
      "bacRecommande": ["C", "D", "E", "F4"],
      "matieresParSerie": {
        "default": ["SVT", "Physique-Chimie", "Mathématiques"]
      },
      "debouches": ["Technicien supérieur des entreprises agricoles", "Technicien supérieur des entreprises forestières", "Technicien supérieur des entreprises de pêche", "Technicien supérieur des entreprises d’élevage", "Sociologue rural", "Animateur agricole et rural", "Conseiller agricole", "Chargé d’études et d’enquêtes agricoles et rurales", "Chargé de communication et de vulgarisation agricole et rurale", "Chargé de développement rural", "Chargé de projet de développement rural", "Chargé de mission sociale dans les organisations paysannes", "Enseignant dans les établissements d’enseignement agricole", "Employé dans les services de développement rural et agricole", "Employé dans les services de vulgarisation agricole et rurale", "Employé dans les services de planification agricole et rurale", "Employé dans les services de développement communautaire", "Employé dans les services de développement social", "Employé dans les services de développement rural intégré", "Employé dans les services de développement participatif", "Employé dans les services de développement local", "Employé dans les services de développement durable"]
    }]
  },
  "Institut Universitaire d’Enseignement Professionnel": {
    " Métiers de l’agriculture": [{
      "filiere": "Métiers de l’agriculture",
      "quotas": "Bourse/Aide/FPP: 50",
      "modeEntree": "Concours",
      "bacRecommande": ["Culture générale", "DEAT (toutes options)"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers de l’agriculture"]
    }]
  },
  "Écoles Inter-États": {
    " École Inter-États des Sciences et Médecine Vétérinaires (EISMV)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 8",
      "modeEntree": "Classement",
      "bacRecommande": ["C", "D"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Vétérinaires"]
    }],
    " École Africaine des Métiers de l’Architecture et de l’Urbanisme (EAMAU)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 5",
      "modeEntree": "Concours",
      "bacRecommande": ["C", "D"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Architectes", "Urbanistes"]
    }],
    " École Supérieure Multinationale de Télécommunications (ESMT)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 11",
      "modeEntree": "Concours",
      "bacRecommande": ["C", "D", "DT"],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Multinationale", "Télécommunications"]
    }],
    " Institut de Formation et de Recherche en Population et Développement (IFORD)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 5",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " Centre Africain d’Études Supérieures en Gestion (CESAG)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 26",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " Centre Appui aux Écoles de Statistique Africaines (CAPESA)": [{
      "filiere": "Toutes les filières",
      "quotas": "Bourse/Aide/FPP: 6",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }],
    " École Centrale de Casablanca": [{
      "filiere": "",
      "quotas": "Bourse/Aide/FPP: 0",
      "modeEntree": "Concours",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": []
    }]
  },
  "Université Africaine de Développement Coopératif": {
    " UFR Économie et Gestion des Coopératives (UFR/EGC)": [{
      "filiere": "Entrepreneuriat et Gestion de Projets et Économie Sociale",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Chef de projets des entreprises publiques, privées et ONG", "Salarié de projets, entreprises industrielles, commerciales et PME", "Cabinet de conseil", "Consultant en développement local", "Coordinateur de projets", "Animateur et évaluateur de projets"]
    }, {
      "filiere": "Économie et Gestion des Coopératives et Associations",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Gestionnaire d’Action Coopérative", "Chargé de développement des Coopératives", "Chargé de gestion des Associations", "Chargé de relations internationales Coopératives"]
    }],
    " UFR Finances et Microfinance (UFR/FM)": [{
      "filiere": "Micro Finance",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Économie (B ou Maths)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Économie", "Mathématiques"]
      },
      "debouches": ["Inspecteur des Finances option Micro Finance", "Chargé d’études financières", "Chargé de développement des Communautés", "Agent de crédit des institutions financières (SFD)"]
    }],
    " UFR Renforcement et Micro Assurance Santé (UFR/RMAS)": [{
      "filiere": "Gestion des structures de Micro Assurance Santé",
      "quotas": "Bourse/Aide FFP: A, B, C, D, G3",
      "modeEntree": "Double adduction: Histoire-Géo (A) ou Maths (B) ou Économie (C)",
      "bacRecommande": ["A", "B", "C", "D", "G3"],
      "matieresParSerie": {
        "default": ["Histoire-Géo", "Mathématiques", "Économie"]
      },
      "debouches": ["Spécialiste d’Action Sanitaire option Micro Assurance Santé", "Chargé de Renforcement du Capital Humain", "Chargé d’Assurance Santé", "Agent d’Assurance Santé", "Agent d’Assurance des Mutuelles de Santé", "Éducateur mutuelles de santé"]
    }],
    " Développement Local et Décentralisation (IRFODEL)": [{
      "filiere": "Développement Local et Décentralisation",
      "quotas": "Bourse/Aide/FFP: A, B, C, D, G2, G3",
      "modeEntree": "À titre payant",
      "bacRecommande": ["A", "B", "C", "D", "G2", "G3"],
      "matieresParSerie": {
        "default": ["Sèmè et développement"]
      },
      "debouches": ["Ingénieurs de développement local et de décentralisation", "Agents de développement local des collectivités", "Spécialistes de la coopération-développement local", "Responsables de projets de développement local", "Animateur développement", "Manager du développement", "Chef de projet de développement", "Entrepreneur"]
    }]
  },
  "Etablissements de Sèmè-City": {
    " Africa Design School": [{
      "filiere": "Licence en Design",
      "quotas": "À titre payant",
      "modeEntree": "À titre payant",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers du design"]
    }],
    " Ecole de l’Innovation et de l’Expertise Informatique (EPITECH)": [{
      "filiere": "Licence en Métier de l’Informatique",
      "quotas": "À titre payant",
      "modeEntree": "À titre payant",
      "bacRecommande": [],
      "matieresParSerie": {
        "default": []
      },
      "debouches": ["Métiers de l’informatique"]
    }]
  }
}*/