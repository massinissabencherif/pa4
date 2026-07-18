# Comicster — raccourcis locaux (délèguent à ./start.sh, le point d'entrée portable).
.DEFAULT_GOAL := help
.PHONY: help demo stop reset logs

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

demo: ## Démarre Comicster en local avec les données de démo
	@./start.sh up

stop: ## Arrête les conteneurs (conserve les données)
	@./start.sh down

reset: ## Repart de zéro (supprime la base) puis redémarre
	@./start.sh reset

logs: ## Affiche les logs en direct
	@./start.sh logs
